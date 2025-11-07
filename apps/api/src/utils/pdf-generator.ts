import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface OrcamentoPDFData {
    // Orçamento
    number: string;
    title: string;
    description: string;
    value: number;
    estimatedDays?: number;
    validUntil?: Date;
    createdAt: Date;

    // Cliente
    cliente: {
        name: string;
        email: string;
        phone?: string;
        company?: string;
        cnpj?: string;
    };

    // Empresa (seus dados)
    empresa: {
        name: string;
        email?: string;
        phone?: string;
        cnpj?: string;
        address?: string;
    };
}

export function gerarOrcamentoPDF(data: OrcamentoPDFData, res: Response) {
    // Criar documento PDF
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
            Title: `Orçamento ${data.number}`,
            Author: data.empresa.name,
        },
    });

    // Enviar PDF diretamente para o response
    doc.pipe(res);

    // ===============================
    // CABEÇALHO
    // ===============================

    // Nome da empresa (título principal)
    doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(data.empresa.name, { align: 'left' });

    // Dados da empresa
    doc.fontSize(10).font('Helvetica');

    let yPosition = doc.y + 5;

    if (data.empresa.email) {
        doc.text(`Email: ${data.empresa.email}`, 50, yPosition);
        yPosition += 15;
    }

    if (data.empresa.phone) {
        doc.text(`Telefone: ${data.empresa.phone}`, 50, yPosition);
        yPosition += 15;
    }

    if (data.empresa.cnpj) {
        doc.text(`CNPJ: ${data.empresa.cnpj}`, 50, yPosition);
        yPosition += 15;
    }

    if (data.empresa.address) {
        doc.text(`Endereço: ${data.empresa.address}`, 50, yPosition);
        yPosition += 15;
    }

    // Linha separadora
    doc
        .moveTo(50, yPosition + 10)
        .lineTo(545, yPosition + 10)
        .stroke();

    // ===============================
    // TÍTULO DO ORÇAMENTO
    // ===============================

    yPosition += 30;

    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('ORÇAMENTO', 50, yPosition, { align: 'center' });

    yPosition += 40;

    // Número e Data
    doc.fontSize(12).font('Helvetica');

    const dataFormatada = new Date(data.createdAt).toLocaleDateString('pt-BR');

    doc.text(`Número: ${data.number}`, 50, yPosition);
    doc.text(`Data: ${dataFormatada}`, 400, yPosition);

    yPosition += 30;

    // ===============================
    // DADOS DO CLIENTE
    // ===============================

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DADOS DO CLIENTE', 50, yPosition);

    yPosition += 25;

    doc.fontSize(11).font('Helvetica');

    doc.text(`Nome: ${data.cliente.name}`, 50, yPosition);
    yPosition += 20;

    if (data.cliente.company) {
        doc.text(`Empresa: ${data.cliente.company}`, 50, yPosition);
        yPosition += 20;
    }

    doc.text(`Email: ${data.cliente.email}`, 50, yPosition);
    yPosition += 20;

    if (data.cliente.phone) {
        doc.text(`Telefone: ${data.cliente.phone}`, 50, yPosition);
        yPosition += 20;
    }

    if (data.cliente.cnpj) {
        doc.text(`CNPJ: ${data.cliente.cnpj}`, 50, yPosition);
        yPosition += 20;
    }

    yPosition += 10;

    // ===============================
    // DESCRIÇÃO DO PROJETO
    // ===============================

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DESCRIÇÃO DO PROJETO', 50, yPosition);

    yPosition += 25;

    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(data.title, 50, yPosition);

    yPosition += 20;

    doc
        .fontSize(11)
        .font('Helvetica')
        .text(data.description, 50, yPosition, {
            width: 495,
            align: 'justify',
        });

    yPosition = doc.y + 20;

    // ===============================
    // VALORES
    // ===============================

    // Caixa de valores (fundo cinza)
    doc
        .rect(50, yPosition, 495, 80)
        .fillAndStroke('#f3f4f6', '#d1d5db');

    yPosition += 20;

    doc.fillColor('#000000');

    // Valor
    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('VALOR TOTAL:', 60, yPosition);

    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#16a34a')
        .text(
            `R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            350,
            yPosition
        );

    yPosition += 30;

    doc.fillColor('#000000').fontSize(11).font('Helvetica');

    // Prazo
    if (data.estimatedDays) {
        doc.text(`Prazo estimado: ${data.estimatedDays} dias`, 60, yPosition);
        yPosition += 20;
    }

    // Validade
    if (data.validUntil) {
        const validadeFormatada = new Date(data.validUntil).toLocaleDateString('pt-BR');
        doc.text(`Validade do orçamento: ${validadeFormatada}`, 60, yPosition);
    }

    yPosition = doc.y + 30;

    // ===============================
    // TERMOS E CONDIÇÕES
    // ===============================

    if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
    }

    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TERMOS E CONDIÇÕES', 50, yPosition);

    yPosition += 20;

    doc.fontSize(10).font('Helvetica');

    const termos = [
        '• Este orçamento é válido até a data especificada acima.',
        '• Os valores apresentados são estimados e podem sofrer alterações mediante acordo entre as partes.',
        '• O prazo de execução será contado a partir da aprovação do orçamento e recebimento do sinal.',
        '• Forma de pagamento: a combinar.',
        '• Dúvidas ou esclarecimentos podem ser solicitados através dos contatos acima.',
    ];

    termos.forEach((termo) => {
        doc.text(termo, 50, yPosition, { width: 495 });
        yPosition = doc.y + 10;
    });

    // ===============================
    // RODAPÉ
    // ===============================

    const pageHeight = doc.page.height;
    const rodapeY = pageHeight - 50;

    doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(
            `Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
            50,
            rodapeY,
            { align: 'center' }
        );

    // Finalizar PDF
    doc.end();
}