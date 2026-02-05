import nodemailer from 'nodemailer';
import { env } from './env';
import logger from './logger';

export const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

transporter.verify((error) => {
    if (error) {
        logger.error({ err: error }, 'Erro na configuração de email');
    } else {
        logger.info('Servidor de email pronto');
    }
});

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
            from: `"${env.APP_NAME}" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || subject,
        });

        logger.info({ messageId: info.messageId }, 'Email enviado');
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error({ err: error }, 'Erro ao enviar email');
        return { success: false, error };
    }
}
