const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'EMAIL_SERVICE_USER',
  'EMAIL_SERVICE_PASS',
  'COMPANY_ADMIN_EMAIL',
  'COMPANY_NAME',
  'FRONTEND_URL',
  'JWT_SECRET',  // This was already required but let's make it explicit
];

const OPTIONAL_ENV_VARS = [
  'ADMIN_USERNAME',     // Will be deprecated in favor of database users
  'ADMIN_PASSWORD_HASH', // Will be deprecated in favor of database users
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