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

    // Verificar pagamentos próximos (cliente) - Todo dia às 9:30h
    cron.schedule('30 9 * * *', async () => {
        logger.info('Executando verificação de pagamentos próximos (cliente)');
        await NotificacaoService.verificarPagamentosProximosCliente();
    });

    // Verificar pagamentos vencidos (cliente) - Todo dia às 10:30h
    cron.schedule('30 10 * * *', async () => {
        logger.info('Executando verificação de pagamentos vencidos (cliente)');
        await NotificacaoService.verificarPagamentosVencidosCliente();
    });

    logger.info('Cron jobs iniciados');
}
