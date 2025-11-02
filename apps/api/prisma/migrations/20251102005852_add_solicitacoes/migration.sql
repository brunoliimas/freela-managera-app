-- CreateEnum
CREATE TYPE "SolicitacaoStatus" AS ENUM ('NOVA', 'ANALISANDO', 'ORCAMENTO_ENVIADO', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DECIMAL(10,2),
    "deadline" TIMESTAMP(3),
    "attachments" JSONB,
    "status" "SolicitacaoStatus" NOT NULL DEFAULT 'NOVA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "orcamentoId" TEXT,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_orcamentoId_key" ON "solicitacoes"("orcamentoId");

-- CreateIndex
CREATE INDEX "solicitacoes_clienteId_idx" ON "solicitacoes"("clienteId");

-- CreateIndex
CREATE INDEX "solicitacoes_status_idx" ON "solicitacoes"("status");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
