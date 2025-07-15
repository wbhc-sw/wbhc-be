-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "investmentPackage" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "submissionStatus" TEXT NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailSentToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailSentToInvestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorAdmin" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "investmentPackage" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "submissionStatus" TEXT NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailSentToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailSentToInvestor" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "callingTimes" INTEGER NOT NULL DEFAULT 0,
    "leadStatus" TEXT NOT NULL DEFAULT 'new',
    "originalInvestorId" TEXT,

    CONSTRAINT "InvestorAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investor_investmentPackage_idx" ON "Investor"("investmentPackage");

-- CreateIndex
CREATE INDEX "Investor_createdAt_idx" ON "Investor"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorAdmin_investmentPackage_idx" ON "InvestorAdmin"("investmentPackage");

-- CreateIndex
CREATE INDEX "InvestorAdmin_createdAt_idx" ON "InvestorAdmin"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorAdmin_leadStatus_idx" ON "InvestorAdmin"("leadStatus");
