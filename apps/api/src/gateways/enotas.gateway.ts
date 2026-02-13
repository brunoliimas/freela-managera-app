import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import logger from '../config/logger';
import type {
    NFSeGateway,
    RegisterCompanyParams,
    EmitirNFSeParams,
    NFSeStatusResult,
    NFSeWebhookEvent,
} from '../interfaces/nfse-gateway.interface';

const BASE_URL = 'https://api.enotas.com.br/v2';

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
    if (!_client) {
        _client = axios.create({
            baseURL: BASE_URL,
            headers: {
                Authorization: `Basic ${env.ENOTAS_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
    }
    return _client;
}

export class ENotasGateway implements NFSeGateway {
    // ─── Empresa ───

    async registerCompany(data: RegisterCompanyParams): Promise<{ empresaId: string }> {
        const payload = {
            cnpj: data.cnpj.replace(/\D/g, ''),
            razaoSocial: data.razaoSocial,
            inscricaoMunicipal: data.inscricaoMunicipal,
            regimeTributario: data.regimeTributario,
            email: data.email,
            endereco: {
                logradouro: data.endereco.logradouro,
                numero: data.endereco.numero,
                complemento: data.endereco.complemento || '',
                bairro: data.endereco.bairro,
                codigoIbgeCidade: data.endereco.codigoMunicipio,
                uf: data.endereco.uf,
                cep: data.endereco.cep.replace(/\D/g, ''),
            },
        };

        const response = await getClient().post('/empresas', payload);

        logger.info({ empresaId: response.data.empresaId }, 'eNotas: empresa registrada');

        return { empresaId: response.data.empresaId };
    }

    // ─── Emissão ───

    async emitirNFSe(params: EmitirNFSeParams): Promise<{ nfeId: string; status: string }> {
        const payload = {
            tipo: 'NFS-e',
            cliente: {
                tipoPessoa: params.tomador.cpfCnpj.replace(/\D/g, '').length > 11 ? 'J' : 'F',
                cpfCnpj: params.tomador.cpfCnpj.replace(/\D/g, ''),
                razaoSocial: params.tomador.razaoSocial,
                email: params.tomador.email,
                endereco: params.tomador.endereco
                    ? {
                          logradouro: params.tomador.endereco.logradouro,
                          numero: params.tomador.endereco.numero,
                          complemento: params.tomador.endereco.complemento || '',
                          bairro: params.tomador.endereco.bairro,
                          codigoIbgeCidade: params.tomador.endereco.codigoMunicipio,
                          uf: params.tomador.endereco.uf,
                          cep: params.tomador.endereco.cep.replace(/\D/g, ''),
                      }
                    : undefined,
            },
            servico: {
                descricao: params.servico.descricao,
                issAliquota: params.servico.issAliquota,
                cnae: params.servico.codigoCnae,
                codigoServicoMunicipio: params.servico.codigoServico,
                valorServicos: params.servico.valorServicos,
            },
        };

        const response = await getClient().post(
            `/empresas/${params.empresaId}/nfes`,
            payload
        );

        logger.info({ nfeId: response.data.nfeId }, 'eNotas: NFS-e emitida');

        return {
            nfeId: response.data.nfeId,
            status: response.data.status || 'Processando',
        };
    }

    // ─── Consulta ───

    async consultarNFSe(empresaId: string, nfeId: string): Promise<NFSeStatusResult> {
        const response = await getClient().get(
            `/empresas/${empresaId}/nfes/${nfeId}`
        );

        const data = response.data;

        return {
            status: data.status,
            numero: data.numero,
            codigoVerificacao: data.codigoVerificacao,
            pdfUrl: data.linkDownloadPDF,
            xmlUrl: data.linkDownloadXML,
            motivoRejeicao: data.motivoStatus,
        };
    }

    // ─── Cancelamento ───

    async cancelarNFSe(empresaId: string, nfeId: string, motivo: string): Promise<void> {
        await getClient().delete(
            `/empresas/${empresaId}/nfes/${nfeId}`,
            { data: { motivo } }
        );

        logger.info({ nfeId }, 'eNotas: NFS-e cancelada');
    }

    // ─── Downloads ───

    async downloadPDF(empresaId: string, nfeId: string): Promise<Buffer> {
        const response = await getClient().get(
            `/empresas/${empresaId}/nfes/${nfeId}/pdf`,
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data);
    }

    async downloadXML(empresaId: string, nfeId: string): Promise<Buffer> {
        const response = await getClient().get(
            `/empresas/${empresaId}/nfes/${nfeId}/xml`,
            { responseType: 'arraybuffer' }
        );

        return Buffer.from(response.data);
    }

    // ─── Webhooks ───

    verifyWebhookPayload(payload: unknown): NFSeWebhookEvent {
        const data = payload as {
            nfeId?: string;
            status?: string;
            numero?: string;
            codigoVerificacao?: string;
            linkDownloadPDF?: string;
            linkDownloadXML?: string;
            motivoStatus?: string;
        };

        if (!data.nfeId || !data.status) {
            throw new Error('Webhook payload inválido: nfeId e status são obrigatórios');
        }

        const statusMap: Record<string, NFSeWebhookEvent['type']> = {
            Autorizada: 'AUTORIZADA',
            Negada: 'REJEITADA',
            Cancelada: 'CANCELADA',
        };

        const type = statusMap[data.status];
        if (!type) {
            throw new Error(`Status de webhook desconhecido: ${data.status}`);
        }

        return {
            type,
            nfeId: data.nfeId,
            numero: data.numero,
            codigoVerificacao: data.codigoVerificacao,
            pdfUrl: data.linkDownloadPDF,
            xmlUrl: data.linkDownloadXML,
            motivoRejeicao: data.motivoStatus,
        };
    }
}

export const nfseGateway = new ENotasGateway();
