-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "portalToken" TEXT,
ADD COLUMN     "portalTokenExpires" TIMESTAMP(3);
