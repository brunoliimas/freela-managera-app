import nodemailer from 'nodemailer';

// Criar transporter (configuração do email)
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outros
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verificar conexão
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Erro na configuração de email:', error);
    } else {
        console.log('✅ Servidor de email pronto');
    }
});

// Função auxiliar para enviar email
export async function sendEmail({
    to,
    subject,
    html,
    text,
}: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.APP_NAME || 'FreelanceManager'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || subject,
        });

        console.log('✅ Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return { success: false, error };
    }
}