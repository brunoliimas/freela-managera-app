export function getEmailLayout(content: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #3b82f6;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .info-box {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
        }
        .alert-box {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FreelanceManager</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
          <p>© ${new Date().getFullYear()} FreelanceManager. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template: Nova solicitação recebida
export function templateNovaSolicitacao(data: {
    solicitacaoTitulo: string;
    clienteNome: string;
    clienteEmail: string;
    descricao: string;
    orcamento?: string;
    prazo?: string;
}): string {
    const content = `
    <h2>🎉 Nova Solicitação Recebida!</h2>
    <p>Você recebeu uma nova solicitação de orçamento.</p>
    
    <div class="info-box">
      <h3>${data.solicitacaoTitulo}</h3>
      <p><strong>Cliente:</strong> ${data.clienteNome}</p>
      <p><strong>Email:</strong> ${data.clienteEmail}</p>
      ${data.orcamento ? `<p><strong>Orçamento estimado:</strong> ${data.orcamento}</p>` : ''}
      ${data.prazo ? `<p><strong>Prazo:</strong> ${data.prazo}</p>` : ''}
    </div>

    <p><strong>Descrição:</strong></p>
    <p>${data.descricao}</p>

    <a href="${process.env.APP_URL || 'http://localhost:3000'}/solicitacoes" class="button">
      Ver Solicitação
    </a>
  `;

    return getEmailLayout(content);
}

// Template: Lembrete de pagamento
export function templateLembretePagamento(data: {
    descricao: string;
    valor: string;
    vencimento: string;
    diasRestantes: number;
    clienteNome: string;
    projetoTitulo: string;
}): string {
    const content = `
    <h2>⏰ Lembrete de Pagamento</h2>
    <p>Você tem um pagamento próximo do vencimento.</p>
    
    <div class="info-box">
      <h3>${data.descricao}</h3>
      <p><strong>Cliente:</strong> ${data.clienteNome}</p>
      <p><strong>Projeto:</strong> ${data.projetoTitulo}</p>
      <p><strong>Valor:</strong> ${data.valor}</p>
      <p><strong>Vence em:</strong> ${data.diasRestantes} dia(s) - ${data.vencimento}</p>
    </div>

    <p>Não esqueça de confirmar o recebimento no sistema após o pagamento.</p>

    <a href="${process.env.APP_URL || 'http://localhost:3000'}/pagamentos" class="button">
      Ver Pagamentos
    </a>
  `;

    return getEmailLayout(content);
}

// Template: Pagamento vencido
export function templatePagamentoVencido(data: {
    descricao: string;
    valor: string;
    vencimento: string;
    diasAtraso: number;
    clienteNome: string;
    clienteEmail: string;
    projetoTitulo: string;
}): string {
    const content = `
    <h2>🚨 Pagamento Vencido</h2>
    <p>Você tem um pagamento em atraso que requer atenção.</p>
    
    <div class="alert-box">
      <h3>${data.descricao}</h3>
      <p><strong>Cliente:</strong> ${data.clienteNome} (${data.clienteEmail})</p>
      <p><strong>Projeto:</strong> ${data.projetoTitulo}</p>
      <p><strong>Valor:</strong> ${data.valor}</p>
      <p><strong>Vencimento:</strong> ${data.vencimento}</p>
      <p><strong>Atraso:</strong> ${data.diasAtraso} dia(s)</p>
    </div>

    <p><strong>Sugestões de ação:</strong></p>
    <ul>
      <li>Entre em contato com o cliente</li>
      <li>Verifique se o pagamento já foi realizado</li>
      <li>Atualize o status no sistema</li>
    </ul>

    <a href="${process.env.APP_URL || 'http://localhost:3000'}/pagamentos" class="button">
      Gerenciar Pagamentos
    </a>
  `;

    return getEmailLayout(content);
}

// Template: Orçamento aprovado
export function templateOrcamentoAprovado(data: {
    orcamentoNumero: string;
    titulo: string;
    valor: string;
    clienteNome: string;
}): string {
    const content = `
    <h2>✅ Orçamento Aprovado!</h2>
    <p>Parabéns! O cliente aprovou seu orçamento.</p>
    
    <div class="info-box">
      <h3>${data.orcamentoNumero} - ${data.titulo}</h3>
      <p><strong>Cliente:</strong> ${data.clienteNome}</p>
      <p><strong>Valor:</strong> ${data.valor}</p>
    </div>

    <p>Próximos passos:</p>
    <ul>
      <li>Criar o projeto baseado no orçamento</li>
      <li>Definir milestones</li>
      <li>Configurar parcelas de pagamento</li>
    </ul>

    <a href="${process.env.APP_URL || 'http://localhost:3000'}/orcamentos" class="button">
      Ver Orçamento
    </a>
  `;

    return getEmailLayout(content);
}

// Template: Recuperação de senha
export function templateRecuperacaoSenha(data: {
    nome: string;
    resetUrl: string;
}): string {
    const content = `
    <h2>Recuperação de Senha</h2>
    <p>Olá, <strong>${data.nome}</strong>!</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>

    <div class="info-box">
      <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</p>
    </div>

    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="button">
        Redefinir Senha
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
    </p>
  `;

    return getEmailLayout(content);
}

// Template: Email para cliente (orçamento)
export function templateOrcamentoCliente(data: {
    orcamentoNumero: string;
    titulo: string;
    descricao: string;
    valor: string;
    prazoEstimado?: string;
    validade?: string;
    empresaNome: string;
    empresaEmail: string;
    empresaTelefone?: string;
}): string {
    const content = `
    <h2>📄 Orçamento - ${data.orcamentoNumero}</h2>
    <p>Olá! Segue o orçamento solicitado:</p>
    
    <div class="info-box">
      <h3>${data.titulo}</h3>
      <!-- ✅ Renderiza HTML diretamente -->
      <div class="prose">
        ${data.descricao}
      </div>
      <p><strong>Valor:</strong> ${data.valor}</p>
    </div>
  `;

    return getEmailLayout(content);
}