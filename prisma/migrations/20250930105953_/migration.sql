-- CreateTable
CREATE TABLE "platform_wallet" (
    "id" TEXT NOT NULL,
    "totalEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_wallet_pkey" PRIMARY KEY ("id")
);
