import { z } from 'zod';

export const saveFiscalConfigSchema = z.object({
    cnae: z.string().min(1, 'CNAE é obrigatório'),
    issAliquota: z.union([z.string(), z.number()]),
    inscricaoMunicipal: z.string().min(1, 'Inscrição municipal é obrigatória'),
    regimeTributario: z.union([z.string(), z.number()]),
    codigoServico: z.string().min(1, 'Código do serviço é obrigatório'),
});

export const registerCompanySchema = z.object({
    cnpj: z.string().min(1, 'CNPJ é obrigatório'),
    razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
    email: z.string().email('Email inválido'),
    cnae: z.string().min(1, 'CNAE é obrigatório'),
    issAliquota: z.union([z.string(), z.number()]),
    inscricaoMunicipal: z.string().min(1, 'Inscrição municipal é obrigatória'),
    regimeTributario: z.union([z.string(), z.number()]),
    codigoServico: z.string().min(1, 'Código do serviço é obrigatório'),
    endereco: z.object({
        logradouro: z.string().min(1, 'Logradouro é obrigatório'),
        numero: z.string().min(1, 'Número é obrigatório'),
        complemento: z.string().optional(),
        bairro: z.string().min(1, 'Bairro é obrigatório'),
        codigoMunicipio: z.string().min(1, 'Código do município é obrigatório'),
        uf: z.string().length(2, 'UF deve ter 2 caracteres'),
        cep: z.string().min(1, 'CEP é obrigatório'),
    }),
});

export const emitirNFSeSchema = z.object({
    pagamentoId: z.string().min(1, 'ID do pagamento é obrigatório'),
    descricaoServico: z.string().min(1, 'Descrição do serviço é obrigatória'),
});

export const cancelarNFSeSchema = z.object({
    motivo: z.string().min(1, 'Motivo do cancelamento é obrigatório'),
});
