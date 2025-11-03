/*
  Warnings:

  - You are about to drop the column `orcamentoId` on the `solicitacoes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[solicitacaoId]` on the table `orcamentos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_orcamentoId_fkey";

-- DropIndex
DROP INDEX "solicitacoes_orcamentoId_key";

-- AlterTable
ALTER TABLE "orcamentos" ADD COLUMN     "solicitacaoId" TEXT;

-- AlterTable
ALTER TABLE "solicitacoes" DROP COLUMN "orcamentoId";

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_solicitacaoId_key" ON "orcamentos"("solicitacaoId");

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
