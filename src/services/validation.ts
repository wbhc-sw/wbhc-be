const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'EMAIL_SERVICE_USER',
  'EMAIL_SERVICE_PASS',
  'COMPANY_ADMIN_EMAIL',
  'COMPANY_NAME',
  'FRONTEND_URL',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 