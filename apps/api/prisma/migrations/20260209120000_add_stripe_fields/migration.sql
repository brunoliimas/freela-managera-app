-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeAccountStatus" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_stripePaymentIntentId_key" ON "pagamentos"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeAccountId_key" ON "users"("stripeAccountId");
