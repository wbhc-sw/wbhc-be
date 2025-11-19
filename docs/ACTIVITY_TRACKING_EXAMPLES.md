# Activity Tracking - Real Examples

This document shows real examples of how requests and responses are logged in the ActivityLog table.

---

## Example 1: User Login

### 📥 **HTTP Request**
```http
POST /api/admin/users/login
Content-Type: application/json

{
  "username": "john_admin",
  "password": "secret123"
}
```

### 📤 **HTTP Response** (Success)
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_admin",
    "email": "john@example.com",
    "role": "company_admin",
    "companyId": 5,
    "company": {
      "companyID": 5,
      "name": "Tech Corp"
    }
  }
}
```
**Status Code:** `200 OK`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "LOGIN",
  "resourceType": "User",
  "resourceId": "550e8400-e29b-41d4-a716-446655440000",
  
  "httpMethod": "POST",
  "endpoint": "/api/admin/users/login",
  "statusCode": 200,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  
  "requestBody": {
    "username": "john_admin"
    // Note: password is NOT logged for security
  },
  "errorMessage": null,
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z"
  },
  
  "createdAt": "2024-01-15T10:30:00.123Z"
}
```

**Key Points:**
- ✅ Password is **NOT** logged (sanitized out)
- ✅ Action is `LOGIN`
- ✅ ResourceType is `User`
- ✅ ResourceId is the user's ID
- ✅ Status 200 = successful login

---

## Example 2: Create InvestorAdmin (Lead)

### 📥 **HTTP Request**
```http
POST /api/admin/investor-admin
Authorization: Cookie: admin_jwt=eyJhbGc...
Content-Type: application/json

{
  "fullName": "Sarah Johnson",
  "phoneNumber": "+1234567890",
  "city": "New York",
  "source": "website",
  "companyID": 5,
  "sharesQuantity": 100,
  "investmentAmount": 5000.00,
  "calculatedTotal": 5000.00,
  "leadStatus": "new",
  "msgDate": "2024-01-15T10:00:00Z",
  "notes": "Interested in Series A funding"
}
```

### 📤 **HTTP Response** (Success)
```json
{
  "success": true,
  "data": {
    "id": 123,
    "fullName": "Sarah Johnson",
    "phoneNumber": "+1234567890",
    "city": "New York",
    "source": "website",
    "companyID": 5,
    "sharesQuantity": 100,
    "investmentAmount": 5000.00,
    "calculatedTotal": 5000.00,
    "leadStatus": "new",
    "notes": "Interested in Series A funding",
    "callingTimes": 0,
    "emailSentToAdmin": false,
    "emailSentToInvestor": false,
    "originalInvestorId": null,
    "msgDate": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```
**Status Code:** `201 Created`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "CREATE",
  "resourceType": "InvestorAdmin",
  "resourceId": "123",
  
  "httpMethod": "POST",
  "endpoint": "/api/admin/investor-admin",
  "statusCode": 201,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "duration": 45,  // milliseconds (optional)
  
  "requestBody": {
    "fullName": "Sarah Johnson",
    "phoneNumber": "+1234567890",
    "city": "New York",
    "source": "website",
    "companyID": 5,
    "sharesQuantity": 100,
    "investmentAmount": 5000.00,
    "calculatedTotal": 5000.00,
    "leadStatus": "new",
    "msgDate": "2024-01-15T10:00:00Z",
    "notes": "Interested in Series A funding"
  },
  "errorMessage": null,
  "metadata": {
    "contentType": "application/json"
  },
  
  "createdAt": "2024-01-15T10:35:00.456Z"
}
```

**Key Points:**
- ✅ Action is `CREATE`
- ✅ ResourceType is `InvestorAdmin`
- ✅ ResourceId is the created lead's ID (123)
- ✅ Full request body is logged (already sanitized by XSS)
- ✅ Status 201 = successful creation

---

## Example 3: GET InvestorAdmin List (with Filters)

### 📥 **HTTP Request**
```http
GET /api/admin/investor-admin?search=Sarah&status=new&city=New%20York&page=1&limit=20
Authorization: Cookie: admin_jwt=eyJhbGc...
```

### 📤 **HTTP Response** (Success)
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "fullName": "Sarah Johnson",
      "phoneNumber": "+1234567890",
      "city": "New York",
      "leadStatus": "new",
      "company": {
        "name": "Tech Corp"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```
**Status Code:** `200 OK`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-003",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "READ",
  "resourceType": "InvestorAdmin",
  "resourceId": null,  // No specific resource, it's a list
  
  "httpMethod": "GET",
  "endpoint": "/api/admin/investor-admin",
  "statusCode": 200,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "duration": 23,  // milliseconds
  
  "requestBody": null,  // GET requests have no body
  "errorMessage": null,
  "metadata": {
    "queryParams": {
      "search": "Sarah",
      "status": "new",
      "city": "New York",
      "page": "1",
      "limit": "20"
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "filters": {
      "search": "Sarah",
      "status": "new",
      "city": "New York"
    }
  },
  
  "createdAt": "2024-01-15T10:40:00.789Z"
}
```

**Key Points:**
- ✅ Action is `READ`
- ✅ ResourceId is `null` (list query, not specific resource)
- ✅ **Metadata contains all query params and filters** - This is the key value!
- ✅ Shows what user searched for: "Sarah", status="new", city="New York"
- ✅ Shows pagination info

---

## Example 4: Update InvestorAdmin (Lead)

### 📥 **HTTP Request**
```http
PUT /api/admin/investor-admin/123
Authorization: Cookie: admin_jwt=eyJhbGc...
Content-Type: application/json

{
  "leadStatus": "contacted",
  "notes": "Called on 2024-01-15. Interested in follow-up meeting.",
  "callingTimes": 1
}
```

### 📤 **HTTP Response** (Success)
```json
{
  "success": true,
  "data": {
    "id": 123,
    "fullName": "Sarah Johnson",
    "phoneNumber": "+1234567890",
    "city": "New York",
    "leadStatus": "contacted",
    "notes": "Called on 2024-01-15. Interested in follow-up meeting.",
    "callingTimes": 1,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```
**Status Code:** `200 OK`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-004",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "UPDATE",
  "resourceType": "InvestorAdmin",
  "resourceId": "123",
  
  "httpMethod": "PUT",
  "endpoint": "/api/admin/investor-admin/123",
  "statusCode": 200,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "duration": 38,
  
  "requestBody": {
    "leadStatus": "contacted",
    "notes": "Called on 2024-01-15. Interested in follow-up meeting.",
    "callingTimes": 1
  },
  "errorMessage": null,
  "metadata": {
    "updatedFields": ["leadStatus", "notes", "callingTimes"]
  },
  
  "createdAt": "2024-01-15T11:00:00.012Z"
}
```

**Key Points:**
- ✅ Action is `UPDATE`
- ✅ ResourceId is the updated lead's ID (123)
- ✅ Request body shows what changed
- ✅ Metadata can include which fields were updated

---

## Example 5: Error Case - Create with Validation Error

### 📥 **HTTP Request**
```http
POST /api/admin/investor-admin
Authorization: Cookie: admin_jwt=eyJhbGc...
Content-Type: application/json

{
  "fullName": "",
  "phoneNumber": "invalid-phone"
}
```

### 📤 **HTTP Response** (Error)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["fullName"],
      "message": "String must contain at least 1 character(s)"
    },
    {
      "path": ["phoneNumber"],
      "message": "Invalid phone number format"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-005",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "CREATE",
  "resourceType": "InvestorAdmin",
  "resourceId": null,  // No resource created due to error
  
  "httpMethod": "POST",
  "endpoint": "/api/admin/investor-admin",
  "statusCode": 400,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "duration": 12,
  
  "requestBody": {
    "fullName": "",
    "phoneNumber": "invalid-phone"
  },
  "errorMessage": "Validation failed: fullName must contain at least 1 character, phoneNumber invalid format",
  "metadata": {
    "errorType": "ValidationError",
    "validationErrors": [
      {
        "field": "fullName",
        "message": "String must contain at least 1 character(s)"
      },
      {
        "field": "phoneNumber",
        "message": "Invalid phone number format"
      }
    ]
  },
  
  "createdAt": "2024-01-15T11:05:00.345Z"
}
```

**Key Points:**
- ✅ Status 400 = error occurred
- ✅ ErrorMessage contains error details
- ✅ Metadata can include structured error info
- ✅ Still logs the request body (what user tried to send)

---

## Example 6: Transfer Investor to Admin Lead

### 📥 **HTTP Request**
```http
POST /api/admin/investor-admin/transfer/investor-123-uuid
Authorization: Cookie: admin_jwt=eyJhbGc...
Content-Type: application/json

{
  "notes": "Transferred from public form",
  "msgDate": "2024-01-15T10:00:00Z"
}
```

### 📤 **HTTP Response** (Success)
```json
{
  "success": true,
  "data": {
    "id": 124,
    "fullName": "Mike Smith",
    "phoneNumber": "+1987654321",
    "originalInvestorId": "investor-123-uuid",
    "leadStatus": "new",
    "companyID": 5
  }
}
```
**Status Code:** `201 Created`

---

### 💾 **ActivityLog Record Created**

```json
{
  "id": "log-006",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_admin",
  "userRole": "company_admin",
  "companyId": 5,
  
  "action": "TRANSFER",
  "resourceType": "InvestorAdmin",
  "resourceId": "124",
  
  "httpMethod": "POST",
  "endpoint": "/api/admin/investor-admin/transfer/investor-123-uuid",
  "statusCode": 201,
  
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "duration": 67,
  
  "requestBody": {
    "notes": "Transferred from public form",
    "msgDate": "2024-01-15T10:00:00Z"
  },
  "errorMessage": null,
  "metadata": {
    "sourceInvestorId": "investor-123-uuid",
    "targetLeadId": 124,
    "transferType": "investor_to_lead"
  },
  
  "createdAt": "2024-01-15T11:10:00.678Z"
}
```

**Key Points:**
- ✅ Action is `TRANSFER` (custom action type)
- ✅ Metadata includes source and target IDs
- ✅ Shows the relationship between Investor and InvestorAdmin

---

## Visual Summary: Database Table View

### ActivityLog Table (Sample Data)

| id | userId | username | action | resourceType | resourceId | endpoint | statusCode | createdAt |
|---|---|---|---|---|---|---|---|---|
| log-001 | 550e8400... | john_admin | LOGIN | User | 550e8400... | /api/admin/users/login | 200 | 2024-01-15 10:30:00 |
| log-002 | 550e8400... | john_admin | CREATE | InvestorAdmin | 123 | /api/admin/investor-admin | 201 | 2024-01-15 10:35:00 |
| log-003 | 550e8400... | john_admin | READ | InvestorAdmin | null | /api/admin/investor-admin | 200 | 2024-01-15 10:40:00 |
| log-004 | 550e8400... | john_admin | UPDATE | InvestorAdmin | 123 | /api/admin/investor-admin/123 | 200 | 2024-01-15 11:00:00 |
| log-005 | 550e8400... | john_admin | CREATE | InvestorAdmin | null | /api/admin/investor-admin | 400 | 2024-01-15 11:05:00 |
| log-006 | 550e8400... | john_admin | TRANSFER | InvestorAdmin | 124 | /api/admin/investor-admin/transfer/... | 201 | 2024-01-15 11:10:00 |

---

## Key Insights from These Examples

### 1. **Metadata is Powerful for GET Requests**
- Example 3 shows how metadata captures search filters
- You can analyze: "What do users search for most?"
- Track pagination patterns

### 2. **Request Body is Valuable for CREATE/UPDATE**
- Example 2 shows full data that was created
- Example 4 shows what fields were changed
- Useful for audit trail and debugging

### 3. **Error Logging is Important**
- Example 5 shows validation errors
- Helps identify common user mistakes
- Can improve UX based on error patterns

### 4. **Custom Actions Work Well**
- Example 6 shows TRANSFER action
- Can track business-specific operations
- More meaningful than generic CREATE/UPDATE

---

## Query Examples: How to Use This Data

### Query 1: "What did user john_admin do today?"
```sql
SELECT action, resourceType, endpoint, createdAt, metadata
FROM ActivityLog
WHERE userId = '550e8400-e29b-41d4-a716-446655440000'
  AND createdAt >= '2024-01-15'
ORDER BY createdAt DESC;
```

### Query 2: "What filters are used most in searches?"
```sql
SELECT 
  metadata->>'filters' as filters,
  COUNT(*) as usage_count
FROM ActivityLog
WHERE action = 'READ' 
  AND resourceType = 'InvestorAdmin'
  AND metadata->>'filters' IS NOT NULL
GROUP BY metadata->>'filters'
ORDER BY usage_count DESC;
```

### Query 3: "Show all errors in the last 24 hours"
```sql
SELECT userId, username, endpoint, errorMessage, createdAt
FROM ActivityLog
WHERE statusCode >= 400
  AND createdAt >= NOW() - INTERVAL '24 hours'
ORDER BY createdAt DESC;
```

---

**This is how your activity tracking will work in practice!** 🎯

