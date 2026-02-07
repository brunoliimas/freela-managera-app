-- CreateEnum
CREATE TYPE "NotificacaoType" AS ENUM ('ORCAMENTO_APROVADO', 'ORCAMENTO_RECUSADO', 'PROJETO_CRIADO', 'PAGAMENTO_CONFIRMADO', 'PAGAMENTO_LEMBRETE', 'PAGAMENTO_VENCIDO', 'MILESTONE_CONCLUIDO', 'ARQUIVO_DISPONIVEL', 'SOLICITACAO_RECEBIDA');

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "type" "NotificacaoType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_userId_idx" ON "notificacoes"("userId");

-- CreateIndex
CREATE INDEX "notificacoes_read_idx" ON "notificacoes"("read");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
