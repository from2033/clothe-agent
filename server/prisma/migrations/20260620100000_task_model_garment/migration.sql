-- 试穿任务记录所选模型与服装品类
ALTER TABLE "TryOnTask" ADD COLUMN "aiModel" TEXT;
ALTER TABLE "TryOnTask" ADD COLUMN "garmentType" TEXT;
