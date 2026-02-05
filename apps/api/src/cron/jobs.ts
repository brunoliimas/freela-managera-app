import cron from 'node-cron';
import { NotificacaoService } from '../services/notificacao.service';
import logger from '../config/logger';

export function iniciarCronJobs() {
    // Verificar pagamentos próximos - Todo dia às 9h
    cron.schedule('0 9 * * *', async () => {
        logger.info('Executando verificação de pagamentos próximos');
        await NotificacaoService.verificarPagamentosProximos();
    });

    // Verificar pagamentos vencidos - Todo dia às 10h
    cron.schedule('0 10 * * *', async () => {
        logger.info('Executando verificação de pagamentos vencidos');
        await NotificacaoService.verificarPagamentosVencidos();
    });

    logger.info('Cron jobs iniciados');
}
