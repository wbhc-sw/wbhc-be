import { prisma } from './database';
import { Request } from 'express';

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'jwt',
  'secret',
  'apiKey',
  'authorization',
];

// Maximum size for request body (in bytes) to prevent log bloat
const MAX_BODY_SIZE = 10000; // 10KB

export interface ActivityLogData {
  userId: string | null;
  username: string;
  userRole: string;
  companyId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  httpMethod: string;
  endpoint: string;
  statusCode: number;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  location?: string | null;
  requestBody?: any;
  errorMessage?: string | null;
  metadata?: any;
}

/**
 * Sanitize request data by removing sensitive fields
 */
export function sanitizeRequestData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeRequestData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extract metadata from request (query params, filters, pagination)
 */
export function extractMetadata(req: Request): any {
  const metadata: any = {};

  // Extract query parameters
  if (Object.keys(req.query).length > 0) {
    metadata.queryParams = req.query;
  }

  // Extract pagination info if present
  if (req.query.page || req.query.limit) {
    metadata.pagination = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
  }

  // Extract filters (common filter fields)
  const filterFields = ['search', 'status', 'city', 'source', 'companyID', 'createdBy', 'updatedBy', 'createdFrom', 'createdTo', 'updatedFrom', 'updatedTo'];
  const filters: any = {};
  let hasFilters = false;

  for (const field of filterFields) {
    if (req.query[field] && req.query[field] !== 'all') {
      filters[field] = req.query[field];
      hasFilters = true;
    }
  }

  if (hasFilters) {
    metadata.filters = filters;
  }

  // Extract route parameters
  if (Object.keys(req.params).length > 0) {
    metadata.routeParams = req.params;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Format error message from error object
 */
export function formatError(error: any): string | null {
  if (!error) return null;

  // If it's already a string
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message;
  }

  // If it has a message property
  if (error.message) {
    return error.message;
  }

  // If it's a ZodError, format validation errors
  if (error.name === 'ZodError' && error.errors) {
    const errors = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return `Validation failed: ${errors}`;
  }

  // Fallback to string representation
  return String(error);
}

/**
 * Get request body size in bytes (approximate)
 */
function getBodySize(body: any): number {
  if (!body) return 0;
  return JSON.stringify(body).length;
}

/**
 * Main function to log activity
 * This is async and should not block the request
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    // Sanitize request body if present
    let sanitizedBody = data.requestBody;
    if (sanitizedBody) {
      sanitizedBody = sanitizeRequestData(sanitizedBody);
      
      // Limit body size to prevent log bloat
      const bodySize = getBodySize(sanitizedBody);
      if (bodySize > MAX_BODY_SIZE) {
        sanitizedBody = {
          _truncated: true,
          _size: bodySize,
          _message: 'Request body too large, truncated',
        };
      }
    }

    // Create activity log entry
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        userRole: data.userRole,
        companyId: data.companyId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        httpMethod: data.httpMethod,
        endpoint: data.endpoint,
        statusCode: data.statusCode,
        duration: data.duration,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        requestBody: sanitizedBody,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    // Don't throw - logging should never break the application
    // Just log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to log activity:', error);
    }
  }
}

