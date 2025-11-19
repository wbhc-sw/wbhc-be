import { Response, NextFunction } from 'express';
import { AuthRequest } from './roleAuth';
import { logActivity, extractMetadata, formatError } from '../services/activityLogger';
import { getLocationFromIP } from '../services/locationService';

// Endpoints to skip tracking
const SKIP_ENDPOINTS = [
  '/health',
  '/api/admin/users/logout', // Logout is tracked separately in route handler
];

// Map HTTP methods to action types
function getActionFromMethod(method: string, endpoint: string): string {
  const upperMethod = method.toUpperCase();

  // Special cases for custom actions
  if (endpoint.includes('/login')) {
    return 'LOGIN';
  }
  if (endpoint.includes('/logout')) {
    return 'LOGOUT';
  }
  if (endpoint.includes('/transfer')) {
    return 'TRANSFER';
  }

  // Standard CRUD operations
  switch (upperMethod) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
      return 'READ';
    default:
      return upperMethod;
  }
}

// Extract resource type from endpoint
function getResourceTypeFromEndpoint(endpoint: string): string {
  // Map endpoints to resource types
  if (endpoint.includes('/investor-admin') || endpoint.includes('/investor-admin/')) {
    return 'InvestorAdmin';
  }
  if (endpoint.includes('/investor-form') || endpoint.includes('/investor')) {
    return 'Investor';
  }
  if (endpoint.includes('/company')) {
    return 'Company';
  }
  if (endpoint.includes('/users') || endpoint.includes('/user')) {
    return 'User';
  }
  return 'Unknown';
}

// Extract resource ID from request
function getResourceId(req: AuthRequest): string | null {
  // Try params first (most common)
  if (req.params.id) {
    return req.params.id;
  }
  if (req.params.companyID) {
    return req.params.companyID;
  }
  if (req.params.investorId) {
    return req.params.investorId;
  }
  if (req.params.userId) {
    return req.params.userId;
  }

  // Try body (for some create operations that return ID)
  if (req.body?.id) {
    return String(req.body.id);
  }

  return null;
}

// Check if request should be tracked
function shouldTrack(req: AuthRequest): boolean {
  // Skip GET requests (as per plan)
  if (req.method === 'GET') {
    console.log(`[shouldTrack] Skipping GET: ${req.path}`);
    return false;
  }

  // Special case: Track login/logout even without authentication
  const isAuthEndpoint = req.path.includes('/login') || req.path.includes('/logout');
  
  // Skip if not authenticated (no user info) UNLESS it's a login/logout endpoint
  if (!req.user && !isAuthEndpoint) {
    console.log(`[shouldTrack] Skipping - No user and not auth endpoint: ${req.path}, has user:`, !!req.user);
    return false;
  }

  // Skip specific endpoints
  if (SKIP_ENDPOINTS.includes(req.path)) {
    console.log(`[shouldTrack] Skipping - In skip list: ${req.path}`);
    return false;
  }

  // Skip health checks
  if (req.path === '/health') {
    console.log(`[shouldTrack] Skipping - Health check`);
    return false;
  }

  console.log(`[shouldTrack] ✅ TRACKING: ${req.method} ${req.path}, has user:`, !!req.user);
  return true;
}

// Get client IP address
function getClientIp(req: AuthRequest): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    req.socket.remoteAddress
  );
}

/**
 * Activity tracking middleware
 * Tracks user actions for audit and analytics
 * 
 * Features:
 * - Skips GET requests (as per plan)
 * - Extracts user info from JWT (req.user)
 * - Tracks CREATE, UPDATE, DELETE, and custom actions
 * - Logs asynchronously to avoid blocking requests
 */
export function activityTracker(req: AuthRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture status code and response
  res.send = function (body: any) {
    // Check NOW if we should track (after route handlers run and req.user is set)
    if (!shouldTrack(req)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ActivityTracker] ${req.method} ${req.path} - SKIPPED (checked after route)`);
      }
      return originalSend.call(this, body);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ActivityTracker] ${req.method} ${req.path} - TRACKING (checked after route, has user: ${!!req.user})`);
    }
    // Restore original send
    res.send = originalSend;

    // Calculate duration
    const duration = Date.now() - startTime;

    // Extract user info from JWT (already available in req.user)
    // For login, extract from response body since req.user doesn't exist yet
    let userId: string | null = null;
    let username = 'anonymous';
    let userRole = 'none';
    let companyId: number | null = null;

    if (req.user) {
      userId = req.user.userId;
      username = req.user.username;
      userRole = req.user.role;
      companyId = req.user.companyId || null;
    } else if (req.path.includes('/login') && res.statusCode === 200) {
      // For successful login, extract user info from response
      try {
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        if (responseBody?.user) {
          userId = responseBody.user.id || null;
          username = responseBody.user.username || req.body?.username || 'unknown';
          userRole = responseBody.user.role || 'unknown';
          companyId = responseBody.user.companyId || null;
        } else if (req.body?.username) {
          // Fallback: use username from request if response doesn't have it
          username = req.body.username;
        }
      } catch (err) {
        // If parsing fails, use request body username
        username = req.body?.username || 'unknown';
      }
    }

    // Use originalUrl for full path (not req.path which is route-relative)
    const fullPath = req.originalUrl.split('?')[0]; // Remove query string

    // Determine action type
    const action = getActionFromMethod(req.method, fullPath);

    // Extract resource type
    const resourceType = getResourceTypeFromEndpoint(fullPath);

    // Extract resource ID from request params OR response body (for CREATE operations)
    let resourceId = getResourceId(req);
    
    // For CREATE operations (POST with 201 status), extract ID from response
    if (!resourceId && req.method === 'POST' && res.statusCode === 201) {
      try {
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        if (responseBody?.data?.id) {
          resourceId = String(responseBody.data.id);
        } else if (responseBody?.id) {
          resourceId = String(responseBody.id);
        }
      } catch (err) {
        // If parsing fails, leave resourceId as null
      }
    }

    // Extract metadata (query params, filters, etc.)
    const metadata = extractMetadata(req);

    // Get request body (sanitized later in logActivity)
    const requestBody = req.method !== 'GET' && req.body ? { ...req.body } : undefined;

    // Format error message if status code indicates error
    let errorMessage: string | null = null;
    if (res.statusCode >= 400) {
      // Try to extract error from response body
      if (body && typeof body === 'object') {
        errorMessage = formatError(body.error || body.message || body);
      } else if (typeof body === 'string') {
        errorMessage = body;
      }
    }

    // Log activity asynchronously (don't block response)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ActivityTracker] Logging: ${action} ${resourceType} - Status: ${res.statusCode}`);
    }
    
    // Get location from IP (async, non-blocking)
    const clientIp = getClientIp(req);
    getLocationFromIP(clientIp).then((location) => {
      return logActivity({
        userId,
        username,
        userRole,
        companyId: companyId || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        httpMethod: req.method,
        endpoint: fullPath,
        statusCode: res.statusCode,
        duration,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
        location,
        requestBody,
        errorMessage,
        metadata,
      });
    }).catch((err) => {
      // Don't break request if logging fails
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ActivityTracker] Activity logging error:', err);
      }
    });

    // Call original send
    return originalSend.call(this, body);
  };

  next();
}

