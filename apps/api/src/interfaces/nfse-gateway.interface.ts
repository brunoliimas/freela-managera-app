/**
 * NFS-e Gateway Interface
 *
 * Camada de abstração para permitir trocar de provider (eNotas, Nuvem Fiscal, etc.)
 * sem modificar os services e controllers.
 */

export interface RegisterCompanyParams {
    cnpj: string;
    razaoSocial: string;
    inscricaoMunicipal: string;
    regimeTributario: number; // 1-SimplesNacional, 2-LucroPresumido, etc.
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

export interface EmitirNFSeParams {
    empresaId: string;
    tomador: {
        cpfCnpj: string;
        razaoSocial: string;
        email: string;
        endereco?: {
            logradouro: string;
            numero: string;
            complemento?: string;
            bairro: string;
            codigoMunicipio: string;
            uf: string;
            cep: string;
        };
    };
    servico: {
        descricao: string;
        issAliquota: number; // percentual (ex: 5.00)
        codigoCnae: string;
        codigoServico: string;
        valorServicos: number; // em reais (ex: 1500.00)
    };
}

export interface NFSeStatusResult {
    status: string;
    numero?: string;
    codigoVerificacao?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    motivoRejeicao?: string;
}

export interface NFSeWebhookEvent {
    type: 'AUTORIZADA' | 'REJEITADA' | 'CANCELADA';
    nfeId: string;
    numero?: string;
    codigoVerificacao?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    motivoRejeicao?: string;
}

export interface NFSeGateway {
    // ─── Empresa ───
    registerCompany(data: RegisterCompanyParams): Promise<{ empresaId: string }>;

    // ─── Emissão ───
    emitirNFSe(params: EmitirNFSeParams): Promise<{ nfeId: string; status: string }>;

    // ─── Consulta ───
    consultarNFSe(empresaId: string, nfeId: string): Promise<NFSeStatusResult>;

    // ─── Cancelamento ───
    cancelarNFSe(empresaId: string, nfeId: string, motivo: string): Promise<void>;

    // ─── Downloads ───
    downloadPDF(empresaId: string, nfeId: string): Promise<Buffer>;
    downloadXML(empresaId: string, nfeId: string): Promise<Buffer>;

    // ─── Webhooks ───
    verifyWebhookPayload(payload: unknown): NFSeWebhookEvent;
}
