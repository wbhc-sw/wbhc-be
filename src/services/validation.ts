const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'EMAIL_SERVICE_USER',
  'EMAIL_SERVICE_PASS',
  'COMPANY_ADMIN_EMAIL',
  'COMPANY_NAME',
  'FRONTEND_URL',
  'JWT_SECRET',
];

const OPTIONAL_ENV_VARS = [
  'FRONTEND_2_URL',
  'FRONTEND_3_URL',
  'PORT',
  'NODE_ENV',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Log optional variables that are missing (for debugging)
  const missingOptional = OPTIONAL_ENV_VARS.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`Optional environment variables not set: ${missingOptional.join(', ')}`);
  }
} 