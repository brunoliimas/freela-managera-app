import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { NFSeService } from '../services/nfse.service';

export const getFiscalConfig = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const config = await NFSeService.getFiscalConfig(userId);
        return res.json(config);
    } catch (error) {
        logger.error({ err: error }, 'Get fiscal config error');
        return res.status(500).json({ error: 'Erro ao buscar configuração fiscal' });
    }
};

export const saveFiscalConfig = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { cnae, issAliquota, inscricaoMunicipal, regimeTributario, codigoServico } = req.body;

        const config = await NFSeService.saveFiscalConfig(userId, {
            cnae,
            issAliquota: parseFloat(issAliquota),
            inscricaoMunicipal,
            regimeTributario: parseInt(regimeTributario),
            codigoServico,
        });

        return res.json({
            message: 'Configuração fiscal salva com sucesso',
            config,
        });
    } catch (error) {
        logger.error({ err: error }, 'Save fiscal config error');
        return res.status(500).json({ error: 'Erro ao salvar configuração fiscal' });
    }
};

export const registerCompany = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const result = await NFSeService.registerCompany(userId, req.body);
        return res.json({
            message: 'Empresa registrada na eNotas com sucesso',
            ...result,
        });
    } catch (error) {
        logger.error({ err: error }, 'Register company error');
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Erro ao registrar empresa na eNotas',
        });
    }
};

export const getNotasFiscais = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { status } = req.query;

        const where: Record<string, unknown> = { userId };

        if (status) {
            where.status = status;
        }

        const notasFiscais = await prisma.notaFiscal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                pagamento: {
                    select: {
                        description: true,
                        value: true,
                        projeto: {
                            select: {
                                number: true,
                                title: true,
                                cliente: {
                                    select: {
                                        name: true,
                                        company: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return res.json(notasFiscais);
    } catch (error) {
        logger.error({ err: error }, 'Get notas fiscais error');
        return res.status(500).json({ error: 'Erro ao buscar notas fiscais' });
    }
};

export const getNotaFiscal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const notaFiscal = await prisma.notaFiscal.findFirst({
            where: { id, userId },
            include: {
                pagamento: {
                    include: {
                        projeto: {
                            include: {
                                cliente: true,
                            },
                        },
                    },
                },
            },
        });

        if (!notaFiscal) {
            return res.status(404).json({ error: 'Nota fiscal não encontrada' });
        }

        return res.json(notaFiscal);
    } catch (error) {
        logger.error({ err: error }, 'Get nota fiscal error');
        return res.status(500).json({ error: 'Erro ao buscar nota fiscal' });
    }
};

export const emitirNFSe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { pagamentoId, descricaoServico } = req.body;

        const notaFiscal = await NFSeService.emitirNFSe(userId, pagamentoId, descricaoServico);

        return res.status(201).json({
            message: 'NFS-e enviada para processamento',
            notaFiscal,
        });
    } catch (error) {
        logger.error({ err: error }, 'Emitir NFS-e error');
        return res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao emitir NFS-e',
        });
    }
};

export const cancelarNFSe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { motivo } = req.body;

        const notaFiscal = await NFSeService.cancelarNFSe(userId, id, motivo);

        return res.json({
            message: 'NFS-e cancelada com sucesso',
            notaFiscal,
        });
    } catch (error) {
        logger.error({ err: error }, 'Cancelar NFS-e error');
        return res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao cancelar NFS-e',
        });
    }
};

export const downloadNFSePDF = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const buffer = await NFSeService.downloadPDF(userId, id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=nfse-${id}.pdf`);
        return res.send(buffer);
    } catch (error) {
        logger.error({ err: error }, 'Download NFS-e PDF error');
        return res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao baixar PDF da NFS-e',
        });
    }
};

export const downloadNFSeXML = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const buffer = await NFSeService.downloadXML(userId, id);

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=nfse-${id}.xml`);
        return res.send(buffer);
    } catch (error) {
        logger.error({ err: error }, 'Download NFS-e XML error');
        return res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao baixar XML da NFS-e',
        });
    }
};
