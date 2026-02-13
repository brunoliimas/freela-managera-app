-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "value" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comentarios_projetoId_idx" ON "comentarios"("projetoId");

-- CreateIndex
CREATE INDEX "comentarios_parentId_idx" ON "comentarios"("parentId");

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
