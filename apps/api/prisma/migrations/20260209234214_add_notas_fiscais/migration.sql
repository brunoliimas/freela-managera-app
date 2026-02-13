-- CreateEnum
CREATE TYPE "NotaFiscalStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'CANCELADA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificacaoType" ADD VALUE 'NFSE_AUTORIZADA';
ALTER TYPE "NotificacaoType" ADD VALUE 'NFSE_REJEITADA';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cnae" TEXT,
ADD COLUMN     "codigoServico" TEXT,
ADD COLUMN     "enotasEmpresaId" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "issAliquota" DECIMAL(5,2),
ADD COLUMN     "regimeTributario" INTEGER;

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "enotasNfeId" TEXT,
    "numero" TEXT,
    "codigoVerificacao" TEXT,
    "status" "NotaFiscalStatus" NOT NULL DEFAULT 'PENDENTE',
    "descricaoServico" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "issAliquota" DECIMAL(5,2) NOT NULL,
    "issValor" DECIMAL(10,2) NOT NULL,
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "motivoRejeicao" TEXT,
    "motivoCancelamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emitidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_enotasNfeId_key" ON "notas_fiscais"("enotasNfeId");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_pagamentoId_key" ON "notas_fiscais"("pagamentoId");

-- CreateIndex
CREATE INDEX "notas_fiscais_userId_idx" ON "notas_fiscais"("userId");

-- CreateIndex
CREATE INDEX "notas_fiscais_status_idx" ON "notas_fiscais"("status");

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
