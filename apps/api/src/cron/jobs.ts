import cron from 'node-cron';
import { NotificacaoService } from '../services/notificacao.service';

export function iniciarCronJobs() {
    // Verificar pagamentos próximos - Todo dia às 9h
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Executando verificação de pagamentos próximos...');
        await NotificacaoService.verificarPagamentosProximos();
    });

    // Verificar pagamentos vencidos - Todo dia às 10h
    cron.schedule('0 10 * * *', async () => {
        console.log('⏰ Executando verificação de pagamentos vencidos...');
        await NotificacaoService.verificarPagamentosVencidos();
    });

    console.log('✅ Cron jobs iniciados');
}

// Sintaxe do cron:
// * * * * * *
// │ │ │ │ │ │
// │ │ │ │ │ └─ Dia da semana (0-7, 0=domingo)
// │ │ │ │ └─── Mês (1-12)
// │ │ │ └───── Dia do mês (1-31)
// │ │ └─────── Hora (0-23)
// │ └───────── Minuto (0-59)
// └─────────── Segundo (0-59) - opcional

// Exemplos:
// '0 9 * * *'      - Todo dia às 9h
// '0 */2 * * *'    - A cada 2 horas
// '*/30 * * * *'   - A cada 30 minutos
// '0 9 * * 1'      - Toda segunda às 9h
// '0 0 1 * *'      - Todo dia 1º do mês à meia-noite