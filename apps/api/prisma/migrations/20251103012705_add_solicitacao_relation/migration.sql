/*
  Warnings:

  - The `status` column on the `solicitacoes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[orcamentoId]` on the table `orcamentos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "solicitacaoStatus" AS ENUM ('NOVA', 'ANALISANDO', 'ORCAMENTO_ENVIADO', 'ARQUIVADA');

-- AlterTable
ALTER TABLE "orcamentos" ADD COLUMN     "orcamentoId" TEXT;

-- AlterTable
ALTER TABLE "solicitacoes" DROP COLUMN "status",
ADD COLUMN     "status" "solicitacaoStatus" NOT NULL DEFAULT 'NOVA';

-- DropEnum
DROP TYPE "SolicitacaoStatus";

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_orcamentoId_key" ON "orcamentos"("orcamentoId");

-- CreateIndex
CREATE INDEX "solicitacoes_status_idx" ON "solicitacoes"("status");
