-- First, create the Company table with sample data
INSERT INTO "Company" ("companyID", "name", "description", "phoneNumber", "url", "createdAt", "updatedAt") VALUES
('1', 'Grab Company', 'Main company for Grab investments', '+966501234567', 'https://grab.sa', NOW(), NOW()),
('2', 'Tala Line', 'Technology investment company', '+966501234567', 'https://talaline.sa', NOW(), NOW()),

-- Update existing Investor records to use companyID "1" (Grab Company)
UPDATE "Investor" SET "companyID" = '0' WHERE "companyID" IS NULL OR "companyID" = '';

-- Update existing InvestorAdmin records to use companyID "1" (Grab Company)
UPDATE "InvestorAdmin" SET "companyID" = '0' WHERE "companyID" IS NULL OR "companyID" = '';
