import prisma from '../config/database';
import { env } from '../config/env';
import logger from '../config/logger';
import { nfseGateway } from '../gateways/enotas.gateway';
import type { NFSeWebhookEvent } from '../interfaces/nfse-gateway.interface';

const isDemoMode = !env.ENOTAS_API_KEY;

interface FiscalConfigInput {
    cnae: string;
    issAliquota: number;
    inscricaoMunicipal: string;
    regimeTributario: number;
    codigoServico: string;
}

interface RegisterCompanyInput extends FiscalConfigInput {
    cnpj: string;
    razaoSocial: string;
    email: string;
    endereco: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        codigoMunicipio: string;
        uf: string;
        cep: string;
    };
}

export class NFSeService {
    static async getFiscalConfig(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                cnae: true,
                issAliquota: true,
                inscricaoMunicipal: true,
                regimeTributario: true,
                codigoServico: true,
                enotasEmpresaId: true,
                cnpj: true,
                company: true,
            },
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }

    static async saveFiscalConfig(userId: string, data: FiscalConfigInput) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                cnae: data.cnae,
                issAliquota: data.issAliquota,
                inscricaoMunicipal: data.inscricaoMunicipal,
                regimeTributario: data.regimeTributario,
                codigoServico: data.codigoServico,
            },
            select: {
                cnae: true,
                issAliquota: true,
                inscricaoMunicipal: true,
                regimeTributario: true,
                codigoServico: true,
                enotasEmpresaId: true,
            },
        });

        return user;
    }

    static async registerCompany(userId: string, data: RegisterCompanyInput) {
        // Salvar config fiscal primeiro
        await NFSeService.saveFiscalConfig(userId, data);

        // Registrar empresa na eNotas
        const { empresaId } = await nfseGateway.registerCompany({
            cnpj: data.cnpj,
            razaoSocial: data.razaoSocial,
            inscricaoMunicipal: data.inscricaoMunicipal,
            regimeTributario: data.regimeTributario,
            email: data.email,
            endereco: data.endereco,
        });

        // Salvar ID da empresa
        await prisma.user.update({
            where: { id: userId },
            data: { enotasEmpresaId: empresaId },
        });

        logger.info({ userId, empresaId }, 'Empresa registrada na eNotas');

        return { empresaId };
    }

    static async emitirNFSe(userId: string, pagamentoId: string, descricaoServico: string) {
        // Buscar user com config fiscal
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                enotasEmpresaId: true,
                cnae: true,
                issAliquota: true,
                codigoServico: true,
            },
        });

        if (!isDemoMode && !user?.enotasEmpresaId) {
            throw new Error('Configure seus dados fiscais e registre sua empresa na eNotas');
        }

        if (!user?.cnae || !user.issAliquota || !user.codigoServico) {
            throw new Error('Dados fiscais incompletos. Verifique CNAE, ISS e código do serviço');
        }

        // Buscar pagamento com dados do cliente
        const pagamento = await prisma.pagamento.findFirst({
            where: { id: pagamentoId, userId },
            include: {
                projeto: {
                    include: {
                        cliente: true,
                    },
                },
                notaFiscal: true,
            },
        });

        if (!pagamento) {
            throw new Error('Pagamento não encontrado');
        }

        if (pagamento.status !== 'PAGO') {
            throw new Error('Só é possível emitir NFS-e para pagamentos com status PAGO');
        }

        if (pagamento.notaFiscal) {
            throw new Error('Já existe uma nota fiscal para este pagamento');
        }

        const issAliquota = Number(user.issAliquota);
        const valor = Number(pagamento.value);
        const issValor = (valor * issAliquota) / 100;

        // Modo demo: cria nota localmente como AUTORIZADA (sem chamar eNotas)
        if (isDemoMode) {
            const demoNumero = `DEMO-${Date.now().toString().slice(-6)}`;
            const notaFiscal = await prisma.notaFiscal.create({
                data: {
                    userId,
                    pagamentoId,
                    descricaoServico,
                    valor: pagamento.value,
                    issAliquota,
                    issValor,
                    status: 'AUTORIZADA',
                    numero: demoNumero,
                    codigoVerificacao: `DEMO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
                    emitidaEm: new Date(),
                },
            });

            logger.info({ notaFiscalId: notaFiscal.id, numero: demoNumero }, 'NFS-e emitida (modo demo)');
            return notaFiscal;
        }

        const cliente = pagamento.projeto.cliente;

        // Criar nota fiscal local com status PENDENTE
        const notaFiscal = await prisma.notaFiscal.create({
            data: {
                userId,
                pagamentoId,
                descricaoServico,
                valor: pagamento.value,
                issAliquota,
                issValor,
                status: 'PENDENTE',
            },
        });

        try {
            // Emitir na eNotas
            const { nfeId } = await nfseGateway.emitirNFSe({
                empresaId: user.enotasEmpresaId!,
                tomador: {
                    cpfCnpj: cliente.cnpj || '',
                    razaoSocial: cliente.company || cliente.name,
                    email: cliente.email,
                    endereco: cliente.address
                        ? {
                              logradouro: cliente.address,
                              numero: 'S/N',
                              bairro: '',
                              codigoMunicipio: '',
                              uf: cliente.state || '',
                              cep: cliente.zipCode || '',
                          }
                        : undefined,
                },
                servico: {
                    descricao: descricaoServico,
                    issAliquota,
                    codigoCnae: user.cnae,
                    codigoServico: user.codigoServico,
                    valorServicos: valor,
                },
            });

            // Atualizar com ID da eNotas e status PROCESSANDO
            const updated = await prisma.notaFiscal.update({
                where: { id: notaFiscal.id },
                data: {
                    enotasNfeId: nfeId,
                    status: 'PROCESSANDO',
                },
            });

            logger.info({ notaFiscalId: notaFiscal.id, nfeId }, 'NFS-e emitida');

            return updated;
        } catch (error) {
            // Se falhar na eNotas, manter como PENDENTE para retry
            logger.error({ err: error }, 'Erro ao emitir NFS-e na eNotas');
            throw error;
        }
    }

    static async cancelarNFSe(userId: string, notaFiscalId: string, motivo: string) {
        const notaFiscal = await prisma.notaFiscal.findFirst({
            where: { id: notaFiscalId, userId },
            include: {
                user: {
                    select: { enotasEmpresaId: true },
                },
            },
        });

        if (!notaFiscal) {
            throw new Error('Nota fiscal não encontrada');
        }

        if (notaFiscal.status !== 'AUTORIZADA') {
            throw new Error('Só é possível cancelar notas fiscais com status AUTORIZADA');
        }

        if (!notaFiscal.enotasNfeId || !notaFiscal.user.enotasEmpresaId) {
            throw new Error('Dados da eNotas não encontrados');
        }

        await nfseGateway.cancelarNFSe(
            notaFiscal.user.enotasEmpresaId,
            notaFiscal.enotasNfeId,
            motivo
        );

        const updated = await prisma.notaFiscal.update({
            where: { id: notaFiscalId },
            data: {
                status: 'CANCELADA',
                motivoCancelamento: motivo,
                canceladaEm: new Date(),
            },
        });

        logger.info({ notaFiscalId }, 'NFS-e cancelada');

        return updated;
    }

    static async downloadPDF(userId: string, notaFiscalId: string) {
        const notaFiscal = await prisma.notaFiscal.findFirst({
            where: { id: notaFiscalId, userId },
            include: {
                user: {
                    select: { enotasEmpresaId: true, company: true },
                },
                pagamento: {
                    include: { projeto: { include: { cliente: true } } },
                },
            },
        });

        if (!notaFiscal) {
            throw new Error('Nota fiscal não encontrada');
        }

        if (isDemoMode) {
            const content = `
NFS-e DEMONSTRAÇÃO
==================
Número: ${notaFiscal.numero}
Código Verificação: ${notaFiscal.codigoVerificacao}
Status: ${notaFiscal.status}
Data Emissão: ${notaFiscal.emitidaEm?.toLocaleDateString('pt-BR') || '-'}

Prestador: ${notaFiscal.user.company || 'N/A'}
Tomador: ${notaFiscal.pagamento.projeto.cliente.name}

Descrição: ${notaFiscal.descricaoServico}
Valor: R$ ${Number(notaFiscal.valor).toFixed(2)}
ISS (${Number(notaFiscal.issAliquota)}%): R$ ${Number(notaFiscal.issValor).toFixed(2)}

--- DOCUMENTO SEM VALOR FISCAL (MODO DEMO) ---
`.trim();
            return Buffer.from(content, 'utf-8');
        }

        if (!notaFiscal.enotasNfeId || !notaFiscal.user.enotasEmpresaId) {
            throw new Error('Dados da eNotas não encontrados');
        }

        return nfseGateway.downloadPDF(
            notaFiscal.user.enotasEmpresaId,
            notaFiscal.enotasNfeId
        );
    }

    static async downloadXML(userId: string, notaFiscalId: string) {
        const notaFiscal = await prisma.notaFiscal.findFirst({
            where: { id: notaFiscalId, userId },
            include: {
                user: {
                    select: { enotasEmpresaId: true, company: true, cnpj: true },
                },
                pagamento: {
                    include: { projeto: { include: { cliente: true } } },
                },
            },
        });

        if (!notaFiscal) {
            throw new Error('Nota fiscal não encontrada');
        }

        if (isDemoMode) {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe>
  <Numero>${notaFiscal.numero}</Numero>
  <CodigoVerificacao>${notaFiscal.codigoVerificacao}</CodigoVerificacao>
  <Status>${notaFiscal.status}</Status>
  <DataEmissao>${notaFiscal.emitidaEm?.toISOString() || ''}</DataEmissao>
  <Prestador>
    <RazaoSocial>${notaFiscal.user.company || ''}</RazaoSocial>
    <CNPJ>${notaFiscal.user.cnpj || ''}</CNPJ>
  </Prestador>
  <Tomador>
    <Nome>${notaFiscal.pagamento.projeto.cliente.name}</Nome>
  </Tomador>
  <Servico>
    <Descricao>${notaFiscal.descricaoServico}</Descricao>
    <ValorServicos>${Number(notaFiscal.valor).toFixed(2)}</ValorServicos>
    <IssAliquota>${Number(notaFiscal.issAliquota).toFixed(2)}</IssAliquota>
    <IssValor>${Number(notaFiscal.issValor).toFixed(2)}</IssValor>
  </Servico>
  <!-- DOCUMENTO SEM VALOR FISCAL (MODO DEMO) -->
</NFSe>`;
            return Buffer.from(xml, 'utf-8');
        }

        if (!notaFiscal.enotasNfeId || !notaFiscal.user.enotasEmpresaId) {
            throw new Error('Dados da eNotas não encontrados');
        }

        return nfseGateway.downloadXML(
            notaFiscal.user.enotasEmpresaId,
            notaFiscal.enotasNfeId
        );
    }

    static async handleWebhookUpdate(event: NFSeWebhookEvent) {
        const notaFiscal = await prisma.notaFiscal.findUnique({
            where: { enotasNfeId: event.nfeId },
        });

        if (!notaFiscal) {
            logger.warn({ nfeId: event.nfeId }, 'NFS-e webhook: nota fiscal não encontrada');
            return;
        }

        const updateData: Record<string, unknown> = {};

        switch (event.type) {
            case 'AUTORIZADA':
                updateData.status = 'AUTORIZADA';
                updateData.numero = event.numero;
                updateData.codigoVerificacao = event.codigoVerificacao;
                updateData.pdfUrl = event.pdfUrl;
                updateData.xmlUrl = event.xmlUrl;
                updateData.emitidaEm = new Date();
                break;

            case 'REJEITADA':
                updateData.status = 'REJEITADA';
                updateData.motivoRejeicao = event.motivoRejeicao;
                break;

            case 'CANCELADA':
                updateData.status = 'CANCELADA';
                updateData.canceladaEm = new Date();
                break;
        }

        await prisma.notaFiscal.update({
            where: { id: notaFiscal.id },
            data: updateData,
        });

        logger.info({
            notaFiscalId: notaFiscal.id,
            type: event.type,
        }, 'NFS-e webhook processado');

        return { notaFiscalId: notaFiscal.id, type: event.type, userId: notaFiscal.userId };
    }
}
