# User Activity Tracking & Audit Log Plan

## Overview
This document outlines the plan for implementing comprehensive user activity tracking and audit logging in the Grab BE Investors application. This will help track user behavior, performance, and provide an audit trail for compliance and debugging.

---

## 1. What We'll Track

### Core Information
- **User ID** - Who performed the action (from JWT token)
- **Timestamp** - When the action occurred
- **Action Type** - What operation was performed (CREATE, READ, UPDATE, DELETE, etc.)
- **Resource Type** - What entity was affected (Investor, InvestorAdmin, Company, User)
- **Resource ID** - Specific record ID that was affected
- **HTTP Method** - GET, POST, PUT, DELETE, etc.
- **Endpoint/Route** - Which API endpoint was called
- **HTTP Status Code** - Success or failure status
- **Request Metadata** - IP address, user agent, request duration

### Additional Context (Optional but Valuable)
- **Request Body** (sanitized) - What data was sent (for CREATE/UPDATE)
- **Metadata** - Query parameters, filters, pagination info (highly recommended for user behavior insights)
- **Company Context** - Which company the action relates to
- **Error Details** - If action failed, what was the error
- **Duration** (optional) - Request duration for performance monitoring (can be added later)

---

## 2. Database Schema Design

### ActivityLog Model
```prisma 
model ActivityLog {
  id            String   @id @default(uuid())
  userId        String   // User who performed the action
  username      String   // Denormalized for quick queries
  userRole      String   // User's role at time of action
  companyId     Int?     // Company context (if applicable)
  
  // Action details
  action        String   // CREATE, READ, UPDATE, DELETE, TRANSFER, LOGIN, LOGOUT
  resourceType  String   // Investor, InvestorAdmin, Company, User
  resourceId    String?  // ID of the affected resource
  
  // Request details
  httpMethod    String   // GET, POST, PUT, DELETE
  endpoint      String   // /api/admin/investor-admin
  statusCode    Int      // 200, 201, 400, 404, etc.
  
  // Performance & metadata
  duration      Int?     // Request duration in milliseconds (optional - for performance monitoring)
  ipAddress     String?  // Client IP address
  userAgent     String?  // Browser/client information
  
  // Context data (JSON fields for flexibility)
  requestBody   Json?    // Sanitized request payload (for CREATE/UPDATE operations)
  errorMessage  String?  // Error details if failed
  metadata      Json?    // Additional context (filters, pagination, query params - highly recommended)
  
  // Timestamps
  createdAt     DateTime @default(now())
  
  // Relationships
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  company       Company? @relation(fields: [companyId], references: [companyID], onDelete: SetNull)
  
  @@index([userId])
  @@index([companyId])
  @@index([action])
  @@index([resourceType])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@index([companyId, createdAt])
  @@index([resourceType, resourceId])
}
```

### Updates to Existing Models
Add optional relation to User and Company models:
```prisma
model User {
  // ... existing fields
  activityLogs  ActivityLog[]
}

model Company {
  // ... existing fields
  activityLogs ActivityLog[]
}
```

---

## 3. Implementation Approach

### Option A: Middleware-Based Tracking (Recommended)
**Pros:**
- Centralized logging logic
- Automatic tracking for all routes
- Easy to maintain and update
- Consistent logging across all endpoints

**Cons:**
- May log some unnecessary requests (health checks, etc.)
- Need to filter what to track

### Option B: Manual Logging in Routes
**Pros:**
- Fine-grained control
- Can log only important actions
- Can include custom context

**Cons:**
- Repetitive code
- Easy to miss some actions
- Inconsistent logging

**Recommendation:** Use **Option A (Middleware)** with smart filtering

---

## 4. What Operations to Track

### High Priority (Always Track)
- ✅ **User Management**
  - User creation, update, deletion
  - Login/logout events
  - Role changes
  - Account activation/deactivation

- ✅ **Investor Operations**
  - Investor form submissions
  - Investor transfers to admin leads
  - Investor updates

- ✅ **InvestorAdmin Operations**
  - Lead creation
  - Lead updates (status changes, notes, etc.)
  - Lead transfers
  - Statistics queries

- ✅ **Company Operations**
  - Company creation
  - Company updates
  - Company deletion

### Medium Priority (Track with Filters)
- ⚠️ **Read Operations** - **SKIPPED FOR NOW**
  - ~~Track GET requests for sensitive data~~
  - ~~Track filtered searches~~
  - **Decision: Ignore GET tracking initially** - Can be added later if needed

- ⚠️ **Bulk Operations**
  - Track batch updates
  - Track exports

### Low Priority (Optional)
- ⚪ **Health Checks** - Skip
- ⚪ **Static Assets** - Skip
- ⚪ **Public Endpoints** - Track only if needed

---

## 5. Middleware Implementation Strategy

### Step 1: Create Activity Logger Service
```typescript
// src/services/activityLogger.ts
- logActivity() - Main logging function
- sanitizeRequestData() - Clean sensitive data
- extractMetadata() - Extract query params, filters, pagination
- calculateDuration() - Track performance (optional)
- formatError() - Extract error details
```

### Step 2: Create Activity Tracking Middleware
```typescript
// src/middleware/activityTracker.ts
- activityTracker() - Main middleware
- shouldTrack() - Determine if request should be logged (skip GET for now)
- extractContext() - Get relevant data from request
- handleAsync() - Properly handle async operations
```

### Step 3: Integration Points
- Add middleware after authentication but before route handlers
- Use Express middleware chain
- Handle errors gracefully (don't break requests if logging fails)

---

## 6. Performance Considerations

### Database Optimization
- **Indexes**: Add indexes on frequently queried fields (userId, createdAt, action, resourceType)
- **Partitioning**: Consider partitioning by date if logs grow very large
- **Archival**: Plan for archiving old logs (e.g., > 1 year)
- **Async Logging**: Log asynchronously to avoid blocking requests

### Query Performance
- **Pagination**: Always paginate activity log queries
- **Filtering**: Support filtering by user, date range, action type
- **Aggregation**: Pre-calculate common statistics (daily activity, top users)

### Storage Management
- **Data Retention**: Define retention policy (e.g., keep 90 days, archive older)
- **Cleanup Jobs**: Scheduled jobs to archive/delete old logs
- **Size Limits**: Limit size of JSON fields (requestBody, metadata) to prevent bloat

---

## 7. Query Capabilities & Analytics

### Basic Queries
- Get all activities for a specific user
- Get all activities for a specific company
- Get activities by action type
- Get activities by resource type
- Get activities within date range

### Advanced Analytics
- **User Activity Dashboard**
  - Most active users
  - User activity timeline
  - Actions per user per day/week/month

- **Performance Metrics** (if duration is tracked)
  - Average request duration
  - Slowest endpoints
  - Error rates by endpoint

- **Business Intelligence**
  - Most common actions
  - Peak usage times
  - Resource access patterns

### API Endpoints for Activity Logs
```
GET /api/admin/activity-logs
  - Query params: userId, companyId, action, resourceType, startDate, endDate, page, limit
  - Returns: Paginated activity logs

GET /api/admin/activity-logs/stats
  - Returns: Aggregated statistics (total actions, top users, etc.)

GET /api/admin/activity-logs/user/:userId
  - Returns: All activities for specific user

GET /api/admin/activity-logs/company/:companyId
  - Returns: All activities for specific company
```

---

## 8. Security & Privacy

### Data Sanitization
- **Sensitive Fields**: Never log passwords, tokens, or PII
- **Request Body**: Sanitize before logging (remove sensitive fields)
- **Error Messages**: Don't log full stack traces in production

### Access Control
- **View Logs**: Only SUPER_ADMIN and COMPANY_ADMIN (for their company)
- **Export Logs**: Restricted to SUPER_ADMIN only
- **Delete Logs**: Only SUPER_ADMIN (with audit trail)

### Compliance
- **GDPR**: Consider data retention and user data deletion
- **Audit Trail**: Never allow deletion of audit logs (soft delete only)

---

## 9. Implementation Steps

### Phase 1: Foundation (Week 1)
1. ✅ Create ActivityLog model in Prisma schema
2. ✅ Run migration to create table
3. ✅ Create activityLogger service
4. ✅ Create activityTracker middleware
5. ✅ Add middleware to main app

### Phase 2: Core Tracking (Week 1-2)
6. ✅ Track POST/PUT/DELETE operations (skip GET for now)
7. ✅ Track user management operations (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
8. ✅ Track investor operations (CREATE, UPDATE, TRANSFER)
9. ✅ Track company operations (CREATE, UPDATE, DELETE)
10. ✅ Test logging functionality

### Phase 3: Analytics & Queries (Week 2)
11. ✅ Create activity log API routes
12. ✅ Implement filtering and pagination
13. ✅ Add basic statistics endpoint
14. ✅ Test query performance

### Phase 4: Optimization (Week 3)
15. ✅ Add indexes for performance
16. ✅ Implement async logging
17. ✅ Add data retention policies
18. ✅ Create cleanup/archival jobs

### Phase 5: Advanced Features (Optional)
19. ⚪ Real-time activity feed
20. ⚪ Activity notifications
21. ⚪ Export functionality
22. ⚪ Dashboard UI integration

---

## 10. Example Use Cases

### Use Case 1: Track User Performance
**Question**: "Which users are most active this week?"
**Query**: Filter by date range, group by userId, count actions

### Use Case 2: Debug Issues
**Question**: "What happened when user X updated investor Y?"
**Query**: Filter by userId and resourceId, show full request/response

### Use Case 3: Compliance Audit
**Question**: "Show all deletions in the last 30 days"
**Query**: Filter by action=DELETE and date range

### Use Case 4: Performance Monitoring (if duration is tracked)
**Question**: "Which endpoints are slowest?"
**Query**: Group by endpoint, calculate average duration

### Use Case 5: User Behavior Analysis
**Question**: "What filters do users use most when searching leads?"
**Query**: Extract from metadata field, analyze filter patterns

---

## 11. Configuration Options

### Environment Variables
```env
# Activity Logging
ACTIVITY_LOGGING_ENABLED=true
ACTIVITY_LOG_RETENTION_DAYS=90
ACTIVITY_LOG_ASYNC=true
ACTIVITY_LOG_SENSITIVE_FIELDS=password,passwordHash,token,jwt
ACTIVITY_LOG_MAX_BODY_SIZE=10000  # bytes
```

### Feature Flags
- Enable/disable logging per environment
- Enable/disable specific action types
- Enable/disable response data logging

---

## 12. Testing Strategy

### Unit Tests
- Test activityLogger service functions
- Test middleware logic
- Test data sanitization

### Integration Tests
- Test logging for each route
- Test query endpoints
- Test filtering and pagination

### Performance Tests
- Test async logging doesn't block requests
- Test query performance with large datasets
- Test cleanup jobs

---

## Next Steps

1. **Review this plan** and provide feedback
2. **Decide on priorities** - what's most important to track first?
3. **Start with Phase 1** - database schema and basic logging
4. **Iterate** - add features based on actual needs

---

## Questions to Consider

1. **Retention Policy**: How long should we keep logs? (Recommendation: 90 days active, 1 year archived)
2. **Logging Level**: Log everything or only important actions? (Recommendation: Start with important, expand as needed)
3. **Duration Tracking**: Should we track request duration? (Recommendation: Optional - add later if performance monitoring is needed)
4. **Real-time**: Do we need real-time activity feeds? (Recommendation: Start with query-based, add real-time later)
5. **Export**: Do we need CSV/Excel export? (Recommendation: Yes, for compliance)

---

## Estimated Impact

- **Database Size**: ~1-5MB per 1000 activities (depends on request body size)
- **Performance**: <5ms overhead per request (with async logging)
- **Storage**: ~500MB-2GB per year (depending on activity volume)
- **Development Time**: 2-3 weeks for full implementation

---

## Final Decisions Summary

### ✅ **Included in Schema:**
- **`metadata`** (Json?) - **HIGHLY RECOMMENDED** - Tracks query params, filters, pagination. Essential for understanding user behavior (what they search, which filters they use).

### ⚠️ **Optional (Can Add Later):**
- **`duration`** (Int?) - Optional field for performance monitoring. Can be added later without breaking changes if performance tracking becomes important.

### ❌ **Removed:**
- **`responseData`** - Not included in schema. Usually not needed and can bloat logs. Error details are captured in `errorMessage` field.

### 🚫 **Skipped for Now:**
- **GET Request Tracking** - Ignored initially to reduce log volume. Can be added later if needed (especially for filtered searches).

### 📊 **Priority Fields:**
1. **Core**: userId, action, resourceType, resourceId, endpoint, statusCode
2. **Context**: metadata (filters, pagination), requestBody (for CREATE/UPDATE)
3. **Optional**: duration (performance), ipAddress, userAgent

### 🎯 **What We'll Track Initially:**
- ✅ POST (CREATE operations)
- ✅ PUT (UPDATE operations)
- ✅ DELETE (DELETE operations)
- ✅ Custom actions (LOGIN, LOGOUT, TRANSFER)
- ❌ GET (READ operations) - Skipped for now

---

**Ready to proceed?** The plan is finalized with these decisions. Should we start implementing Phase 1 (database schema and basic logging)?

