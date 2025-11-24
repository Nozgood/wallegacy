-- CreateTable
CREATE TABLE "Notary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Testator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicKey" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SuccessionPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "testatorPublicKey" TEXT NOT NULL,
    "notaryUsername" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "SuccessionPlan_testatorPublicKey_fkey" FOREIGN KEY ("testatorPublicKey") REFERENCES "Testator" ("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SuccessionPlan_notaryUsername_fkey" FOREIGN KEY ("notaryUsername") REFERENCES "Notary" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Notary_username_key" ON "Notary"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Testator_publicKey_key" ON "Testator"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionPlan_testatorPublicKey_key" ON "SuccessionPlan"("testatorPublicKey");
