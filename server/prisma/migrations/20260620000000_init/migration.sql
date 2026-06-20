CREATE TYPE "ProductPlatform" AS ENUM ('TAOBAO', 'TMALL');
CREATE TYPE "ParseStatus" AS ENUM ('SUCCEEDED', 'FAILED');
CREATE TYPE "TryOnStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "openId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_openId_key" ON "User"("openId");

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "height" TEXT NOT NULL DEFAULT '',
  "weight" TEXT NOT NULL DEFAULT '',
  "bust" TEXT NOT NULL DEFAULT '',
  "waist" TEXT NOT NULL DEFAULT '',
  "hips" TEXT NOT NULL DEFAULT '',
  "photoFileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "normalizedUrl" TEXT NOT NULL,
  "platform" "ProductPlatform" NOT NULL,
  "title" TEXT NOT NULL,
  "imageFileId" TEXT NOT NULL,
  "parseStatus" "ParseStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Product_userId_normalizedUrl_parseStatus_idx" ON "Product"("userId", "normalizedUrl", "parseStatus");

CREATE TABLE "TryOnTask" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "productTitle" TEXT NOT NULL,
  "productImageFileId" TEXT NOT NULL,
  "personImageFileId" TEXT NOT NULL,
  "resultImageFileId" TEXT,
  "provider" TEXT NOT NULL,
  "providerTaskId" TEXT,
  "status" "TryOnStatus" NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TryOnTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TryOnTask_userId_createdAt_idx" ON "TryOnTask"("userId", "createdAt" DESC);
CREATE INDEX "TryOnTask_userId_productId_status_createdAt_idx" ON "TryOnTask"("userId", "productId", "status", "createdAt" DESC);

CREATE TABLE "StoredFile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoredFile_objectKey_key" ON "StoredFile"("objectKey");
CREATE INDEX "StoredFile_userId_kind_idx" ON "StoredFile"("userId", "kind");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
