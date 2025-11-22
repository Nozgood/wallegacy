-- CreateTable
CREATE TABLE "SuccessionPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientAddress" TEXT NOT NULL,
    "notaryName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionPlan_clientAddress_key" ON "SuccessionPlan"("clientAddress");
