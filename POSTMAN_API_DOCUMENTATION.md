# Complete API Documentation - Postman Testing Guide

## 🚀 Investor Form Backend API with Enterprise Role-Based Authentication

This document provides **comprehensive API documentation** for testing all endpoints using Postman. The system includes investor form submissions, company management, lead management, and **advanced enterprise-grade role-based user authentication** with **multi-tenant company-scoped access control**.

---

## 📋 Quick Start Guide

### 1. **Environment Setup**
Create a Postman environment with these variables:
```
base_url: http://localhost:4000
admin_jwt: (leave empty - will be set after login)
user_id: (will be set after login)
current_role: (will be set after login)
company_id: (for testing company-specific access)
test_company_id: 2 (for testing cross-company access restrictions)
test_investor_id: (will be set after creating investor)
test_lead_id: (will be set after creating lead)
```

### 2. **Authentication Flow**
1. **Login** with user credentials (database users or legacy admin)
2. **JWT token** automatically set as HttpOnly cookie
3. **All subsequent requests** automatically include the cookie
4. **Test different user roles** and access levels
5. **Verify company-scoped access** restrictions

### 3. **Testing Strategy**
1. **Create users** with different roles using SUPER_ADMIN
2. **Login as each user** to test role-specific access
3. **Test company-scoped restrictions** by trying to access other companies' data
4. **Verify CRUD permissions** for each role type

---

## 🎭 User Roles & Permissions Matrix

| Role | System Access | Company Access | Create | Read | Update | Delete | User Mgmt |
|------|--------------|----------------|--------|------|--------|--------|-----------|
| **super_admin** | ✅ Full | ✅ All Companies | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Full |
| **company_admin** | ❌ Limited | ✅ Assigned Only | ✅ Company | ✅ Company | ✅ Company | ✅ Company | ❌ None |
| **super_viewer** | ✅ Full | ✅ All Companies | ❌ None | ✅ All | ❌ None | ❌ None | ❌ None |
| **company_viewer** | ❌ Limited | ✅ Assigned Only | ❌ None | ✅ Company | ❌ None | ❌ None | ❌ None |
| **super_creator** | ✅ Full | ✅ All Companies | ✅ All | ✅ All | ❌ None | ❌ None | ❌ None |
| **company_creator** | ❌ Limited | ✅ Assigned Only | ✅ Company | ✅ Company | ❌ None | ❌ None | ❌ None |

### **Access Control Rules**
- **SUPER roles** can access data from any company
- **COMPANY roles** can only access data from their assigned company
- **ADMIN roles** have full CRUD permissions within their scope
- **VIEWER roles** have read-only access within their scope
- **CREATOR roles** can create and read, but cannot update or delete
- **User Management** is restricted to SUPER_ADMIN only

---

## 📋 Complete API Endpoints Overview

| Method | Endpoint | Description | Auth | Roles Allowed |
|--------|----------|-------------|------|---------------|
| **🔐 User Management** |
| `POST` | `/api/admin/users/login` | User authentication | ❌ | All |
| `POST` | `/api/admin/users/logout` | User logout | ✅ JWT | All authenticated |
| `GET` | `/api/admin/users` | Get all users | ✅ JWT | super_admin |
| `GET` | `/api/admin/users/:id` | Get user by ID | ✅ JWT | super_admin |
| `POST` | `/api/admin/users` | Create new user | ✅ JWT | super_admin |
| `PUT` | `/api/admin/users/:id` | Update user | ✅ JWT | super_admin |
| `DELETE` | `/api/admin/users/:id` | Delete user | ✅ JWT | super_admin |
| `GET` | `/api/admin/users/me/profile` | Get current user profile | ✅ JWT | All authenticated |
| **🏛️ Legacy Authentication** |
| `POST` | `/api/admin/login` | Legacy admin auth | ❌ | Legacy only |
| `POST` | `/api/admin/logout` | Legacy admin logout | ✅ JWT | Legacy only |
| **🏢 Company Management** |
| `GET` | `/api/admin/company` | Get companies | ✅ JWT | All roles (scoped) |
| `GET` | `/api/admin/company/:companyID` | Get specific company | ✅ JWT | All roles (scoped) |
| `POST` | `/api/admin/company` | Create new company | ✅ JWT | super_admin, super_creator |
| `PUT` | `/api/admin/company/:companyID` | Update company | ✅ JWT | super_admin, company_admin |
| `DELETE` | `/api/admin/company/:companyID` | Delete company | ✅ JWT | super_admin, company_admin |
| **📝 Investor Form** |
| `POST` | `/api/investor-form` | Submit investor form | ❌ | Public |
| `GET` | `/api/investor-form` | Get all submissions | ✅ JWT | All roles (scoped) |
| **👥 Lead Management** |
| `GET` | `/api/admin/investor-admin` | Get all leads | ✅ JWT | All roles (scoped) |
| `POST` | `/api/admin/investor-admin` | Create new lead | ✅ JWT | admin, creator roles |
| `PUT` | `/api/admin/investor-admin/:id` | Update lead | ✅ JWT | admin roles only |
| `POST` | `/api/admin/investor-admin/transfer/:investorId` | Transfer submission | ✅ JWT | admin, creator roles |
| `GET` | `/api/admin/investor-admin/statistics` | Get statistics | ✅ JWT | All roles (scoped) |
| **🏥 System** |
| `GET` | `/health` | Health check | ❌ | Public |

---

## 🔐 User Management & Authentication Endpoints

### **POST http://localhost:4000/api/admin/users/login**
**Description:** Authenticate with database user or legacy admin

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Expected Response (200) - Database User:**
```json
{
  "success": true,
  "user": {
    "id": "ba50867e-4b52-4134-9f86-6c5c6e088219",
    "username": "admin",
    "email": "admin@yourcompany.com",
    "role": "super_admin",
    "companyId": null,
    "company": null
  }
}
```

**Expected Response (200) - Company User:**
```json
{
  "success": true,
  "user": {
    "id": "company-user-uuid",
    "username": "company_admin_1",
    "email": "company1@test.com",
    "role": "company_admin",
    "companyId": 1,
    "company": {
      "companyID": 1,
      "name": "Grab Company"
    }
  }
}
```

**Expected Response (200) - Legacy Admin:**
```json
{
  "success": true,
  "user": {
    "id": "legacy-admin",
    "username": "admin",
    "email": "admin@legacy.com",
    "role": "super_admin",
    "isLegacy": true
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Test Scripts:**
```javascript
// Extract user info and set environment variables
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    if (responseJson.success && responseJson.user) {
        pm.environment.set('user_id', responseJson.user.id);
        pm.environment.set('current_role', responseJson.user.role);
        if (responseJson.user.companyId) {
            pm.environment.set('company_id', responseJson.user.companyId);
        }
    }
    
    // Extract JWT from cookies
    const cookies = pm.response.headers.get('Set-Cookie');
    if (cookies) {
        const jwtMatch = cookies.match(/admin_jwt=([^;]+)/);
        if (jwtMatch) {
            pm.environment.set('admin_jwt', jwtMatch[1]);
        }
    }
}
```

---

### **GET http://localhost:4000/api/admin/users**
**Description:** Get all users (SUPER_ADMIN only)

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ba50867e-4b52-4134-9f86-6c5c6e088219",
      "username": "admin",
      "email": "admin@yourcompany.com",
      "role": "super_admin",
      "companyId": null,
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "company": null
    },
    {
      "id": "company-admin-uuid",
      "username": "company_admin_1",
      "email": "company1@test.com",
      "role": "company_admin",
      "companyId": 1,
      "isActive": true,
      "createdAt": "2025-01-15T11:00:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z",
      "company": {
        "companyID": 1,
        "name": "Grab Company"
      }
    }
  ]
}
```

**Error Response (403) - Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Access denied. Required roles: super_admin"
}
```

---

### **POST http://localhost:4000/api/admin/users**
**Description:** Create new user (SUPER_ADMIN only)

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={{admin_jwt}}
```

**Body Examples:**

**Super Admin User:**
```json
{
  "username": "super_admin_2",
  "email": "superadmin2@test.com",
  "password": "password123",
  "role": "super_admin"
}
```

**Company Admin User:**
```json
{
  "username": "company_admin_1",
  "email": "company1@test.com",
  "password": "password123",
  "role": "company_admin",
  "companyId": 1
}
```

**Company Viewer User:**
```json
{
  "username": "company_viewer_1",
  "email": "viewer1@test.com",
  "password": "password123",
  "role": "company_viewer",
  "companyId": 1
}
```

**Company Creator User:**
```json
{
  "username": "company_creator_1",
  "email": "creator1@test.com",
  "password": "password123",
  "role": "company_creator",
  "companyId": 1
}
```

**Field Validation:**
- **username**: Required, min 3 characters, unique
- **email**: Required, valid email format, unique
- **password**: Required, min 6 characters
- **role**: Required, one of the 6 valid roles
- **companyId**: Optional for super roles, required for company roles

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-user-uuid",
    "username": "company_admin_1",
    "email": "company1@test.com",
    "role": "company_admin",
    "companyId": 1,
    "isActive": true,
    "createdAt": "2025-01-15T12:00:00.000Z",
    "company": {
      "companyID": 1,
      "name": "Grab Company"
    }
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["username"],
      "message": "Username must be at least 3 characters"
    },
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

**Duplicate Error (400):**
```json
{
  "success": false,
  "error": "Username or email already exists"
}
```

---

### **GET http://localhost:4000/api/admin/users/me/profile**
**Description:** Get current user profile

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Expected Response (200) - Super Admin:**
```json
{
  "success": true,
  "data": {
    "id": "ba50867e-4b52-4134-9f86-6c5c6e088219",
    "username": "admin",
    "email": "admin@yourcompany.com",
    "role": "super_admin",
    "companyId": null,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "company": null
  }
}
```

**Expected Response (200) - Company User:**
```json
{
  "success": true,
  "data": {
    "id": "company-user-uuid",
    "username": "company_admin_1",
    "email": "company1@test.com",
    "role": "company_admin",
    "companyId": 1,
    "isActive": true,
    "createdAt": "2025-01-15T11:00:00.000Z",
    "company": {
      "companyID": 1,
      "name": "Grab Company",
      "description": "Main company for investments"
    }
  }
}
```

---

## 🏢 Company Management Endpoints

### **GET http://localhost:4000/api/admin/company**
**Description:** Retrieve companies (role-based filtering applied)

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Expected Response (200) - Super Roles:**
```json
{
  "success": true,
  "data": [
    {
      "companyID": 1,
      "name": "Grab Company",
      "description": "Main company for Grab investments",
      "phoneNumber": "+966501234567",
      "url": "https://grab.sa",
      "createdAt": "2025-08-27T10:57:22.882Z",
      "updatedAt": "2025-08-27T10:57:22.882Z"
    },
    {
      "companyID": 2,
      "name": "Tech Innovations",
      "description": "Technology company",
      "phoneNumber": "+1234567890",
      "url": "https://techinnovations.com",
      "createdAt": "2025-08-27T11:00:00.000Z",
      "updatedAt": "2025-08-27T11:00:00.000Z"
    }
  ]
}
```

**Expected Response (200) - Company Roles (companyId: 1):**
```json
{
  "success": true,
  "data": [
    {
      "companyID": 1,
      "name": "Grab Company",
      "description": "Main company for Grab investments",
      "phoneNumber": "+966501234567",
      "url": "https://grab.sa",
      "createdAt": "2025-08-27T10:57:22.882Z",
      "updatedAt": "2025-08-27T10:57:22.882Z"
    }
  ]
}
```

**Error Response (403) - No Company Assigned:**
```json
{
  "success": false,
  "error": "No company assigned to your account"
}
```

---

### **POST http://localhost:4000/api/admin/company**
**Description:** Create new company

**Allowed Roles:** `super_admin`, `super_creator`

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={{admin_jwt}}
```

**Body (raw JSON):**
```json
{
  "name": "New Tech Company",
  "description": "Innovative technology solutions",
  "phoneNumber": "+1234567890",
  "url": "https://newtech.com"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "companyID": 5,
    "name": "New Tech Company",
    "description": "Innovative technology solutions",
    "phoneNumber": "+1234567890",
    "url": "https://newtech.com",
    "createdAt": "2025-08-27T11:42:55.643Z",
    "updatedAt": "2025-08-27T11:42:55.643Z"
  }
}
```

**Error Response (403) - Company User Trying to Create:**
```json
{
  "success": false,
  "error": "Company-specific users cannot create new companies. Only SUPER_ADMIN and SUPER_CREATOR can create companies."
}
```

---

## 📝 Investor Form Endpoints

### **POST http://localhost:4000/api/investor-form**
**Description:** Submit new investor inquiry (Public endpoint - no auth required)

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+966501234567",
  "companyID": 1,
  "sharesQuantity": 100,
  "calculatedTotal": 5000,
  "city": "Riyadh"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Submission received",
  "data": {
    "id": "uuid-string",
    "createdAt": "2025-08-27T11:04:05.470Z"
  }
}
```

**Test Scripts:**
```javascript
// Save investor ID for later tests
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.success && responseJson.data && responseJson.data.id) {
        pm.environment.set('test_investor_id', responseJson.data.id);
    }
}
```

---

### **GET http://localhost:4000/api/investor-form**
**Description:** Retrieve investor submissions (role-based filtering)

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Expected Response (200) - Super Roles:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "fullName": "John Doe",
      "phoneNumber": "+966501234567",
      "companyID": 1,
      "sharesQuantity": 100,
      "calculatedTotal": 5000,
      "city": "Riyadh",
      "source": "received",
      "createdAt": "2025-08-27T11:04:05.470Z",
      "updatedAt": "2025-08-27T11:04:05.470Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false,
      "transferred": false,
      "company": {
        "companyID": 1,
        "name": "Grab Company"
      }
    }
  ]
}
```

**Expected Response (200) - Company Roles:**
Only shows investors from their assigned company.

---

## 👥 Lead Management Endpoints

### **GET http://localhost:4000/api/admin/investor-admin**
**Description:** Retrieve admin leads with filtering (role-based access)

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Query Parameters (Optional):**
```
?search=John          # Search in fullName and phoneNumber
?status=contacted     # Filter by leadStatus
?city=Riyadh         # Filter by city
?companyID=1         # Filter by company (SUPER roles only)
```

**Expected Response (200) - Super Roles:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "phoneNumber": "+966501234567",
      "companyID": 1,
      "sharesQuantity": 100,
      "calculatedTotal": 5000,
      "investmentAmount": 5000,
      "city": "Riyadh",
      "source": "received",
      "notes": "VIP lead",
      "callingTimes": 2,
      "leadStatus": "contacted",
      "originalInvestorId": "original-uuid",
      "createdAt": "2025-08-27T11:04:05.470Z",
      "updatedAt": "2025-08-27T11:04:05.470Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false,
      "company": {
        "name": "Grab Company"
      }
    }
  ]
}
```

**Expected Response (200) - Company Roles:**
Only shows leads from their assigned company, companyID filter is ignored.

---

### **POST http://localhost:4000/api/admin/investor-admin**
**Description:** Create new admin lead

**Allowed Roles:** `super_admin`, `company_admin`, `super_creator`, `company_creator`

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={{admin_jwt}}
```

**Body (raw JSON) - Super Roles:**
```json
{
  "fullName": "TEST LEAD",
  "phoneNumber": "+966536514765",
  "companyID": 2,
  "sharesQuantity": 5000,
  "calculatedTotal": 20000,
  "investmentAmount": 20000,
  "source": "Whatsapp",
  "city": "المدينة المنورة",
  "notes": "Test lead creation",
  "callingTimes": 0,
  "leadStatus": "contacted"
}
```

**Body (raw JSON) - Company Roles:**
```json
{
  "fullName": "COMPANY TEST LEAD",
  "phoneNumber": "+966536514765",
  "companyID": 1,
  "sharesQuantity": 5000,
  "calculatedTotal": 20000,
  "investmentAmount": 20000,
  "source": "Whatsapp",
  "city": "المدينة المنورة",
  "notes": "Test lead for company",
  "callingTimes": 0,
  "leadStatus": "contacted"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 396,
    "fullName": "TEST LEAD",
    "phoneNumber": "+966536514765",
    "city": "المدينة المنورة",
    "source": "Whatsapp",
    "createdAt": "2025-09-07T13:21:48.000Z",
    "updatedAt": "2025-09-07T13:21:48.000Z",
    "emailSentToAdmin": false,
    "emailSentToInvestor": false,
    "notes": "Test lead creation",
    "callingTimes": 0,
    "leadStatus": "contacted",
    "originalInvestorId": null,
    "investmentAmount": 20000,
    "calculatedTotal": 20000,
    "sharesQuantity": 5000,
    "companyID": 2
  }
}
```

**Error Response (403) - Company User Trying Wrong Company:**
```json
{
  "success": false,
  "error": "Access denied. You can only create leads for company ID 1, but you tried to create for company ID 2"
}
```

**Test Scripts:**
```javascript
// Save lead ID for later tests
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.success && responseJson.data && responseJson.data.id) {
        pm.environment.set('test_lead_id', responseJson.data.id);
    }
}
```

---

### **PUT http://localhost:4000/api/admin/investor-admin/:id**
**Description:** Update existing admin lead

**Allowed Roles:** `super_admin`, `company_admin`

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={{admin_jwt}}
```

**URL Parameters:**
```
id: {{test_lead_id}}
```

**Body (raw JSON):**
```json
{
  "notes": "Updated lead notes - contacted twice",
  "callingTimes": 2,
  "leadStatus": "interested",
  "investmentAmount": 25000
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 396,
    "fullName": "TEST LEAD",
    "phoneNumber": "+966536514765",
    "notes": "Updated lead notes - contacted twice",
    "callingTimes": 2,
    "leadStatus": "interested",
    "investmentAmount": 25000,
    "updatedAt": "2025-09-07T14:30:00.000Z"
  }
}
```

**Error Response (403) - Viewer/Creator Role:**
```json
{
  "success": false,
  "error": "Access denied. Required roles: super_admin, company_admin"
}
```

**Error Response (403) - Company Admin Accessing Other Company:**
```json
{
  "success": false,
  "error": "Access denied to this lead"
}
```

---

### **POST http://localhost:4000/api/admin/investor-admin/transfer/:investorId**
**Description:** Transfer investor submission to admin lead

**Allowed Roles:** `super_admin`, `company_admin`, `super_creator`, `company_creator`

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={{admin_jwt}}
```

**URL Parameters:**
```
investorId: {{test_investor_id}}
```

**Body (raw JSON):**
```json
{
  "notes": "Transferred from public submission - high priority"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 397,
    "fullName": "John Doe",
    "phoneNumber": "+966501234567",
    "companyID": 1,
    "sharesQuantity": 100,
    "calculatedTotal": 5000,
    "city": "Riyadh",
    "source": "received",
    "notes": "Transferred from public submission - high priority",
    "callingTimes": 0,
    "leadStatus": "new",
    "originalInvestorId": "original-investor-uuid",
    "createdAt": "2025-09-07T14:45:00.000Z",
    "updatedAt": "2025-09-07T14:45:00.000Z"
  }
}
```

**Error Response (403) - Company User Accessing Other Company:**
```json
{
  "success": false,
  "error": "Access denied to this investor"
}
```

**Error Response (409) - Already Transferred:**
```json
{
  "success": false,
  "error": "Investor already transferred"
}
```

---

### **GET http://localhost:4000/api/admin/investor-admin/statistics**
**Description:** Get investment statistics (role-based filtering)

**Headers:**
```
Cookie: admin_jwt={{admin_jwt}}
```

**Expected Response (200) - Super Roles:**
```json
{
  "success": true,
  "data": {
    "_max": { "investmentAmount": 50000 },
    "_min": { "investmentAmount": 1000 },
    "_avg": { "investmentAmount": 15000 },
    "_sum": { "investmentAmount": 300000 },
    "_count": { "investmentAmount": 20 }
  }
}
```

**Expected Response (200) - Company Roles:**
Statistics filtered to their assigned company only.

---

## 🧪 Role-Based Testing Scenarios

### **Scenario 1: Super Admin Full Access**

**Setup:**
```javascript
// Create super admin user
POST /api/admin/users
{
  "username": "test_super_admin",
  "email": "superadmin@test.com",
  "password": "password123",
  "role": "super_admin"
}
```

**Tests to Run:**
1. ✅ `GET /api/admin/users` - Should see all users
2. ✅ `GET /api/admin/company` - Should see all companies
3. ✅ `POST /api/admin/company` - Should create company
4. ✅ `GET /api/admin/investor-admin` - Should see all leads
5. ✅ `POST /api/admin/investor-admin` - Should create lead for any company
6. ✅ `PUT /api/admin/investor-admin/:id` - Should update any lead
7. ✅ `DELETE /api/admin/users/:id` - Should delete users

### **Scenario 2: Company Admin Scoped Access**

**Setup:**
```javascript
// Create company admin for company 1
POST /api/admin/users
{
  "username": "test_company_admin",
  "email": "companyadmin@test.com",
  "password": "password123",
  "role": "company_admin",
  "companyId": 1
}
```

**Tests to Run:**
1. ❌ `GET /api/admin/users` - Should be denied
2. ✅ `GET /api/admin/company` - Should see only company 1
3. ❌ `POST /api/admin/company` - Should be denied
4. ✅ `GET /api/admin/investor-admin` - Should see only company 1 leads
5. ✅ `POST /api/admin/investor-admin` (companyID: 1) - Should work
6. ❌ `POST /api/admin/investor-admin` (companyID: 2) - Should be denied
7. ✅ `PUT /api/admin/investor-admin/:id` (company 1 lead) - Should work
8. ❌ `PUT /api/admin/investor-admin/:id` (company 2 lead) - Should be denied

### **Scenario 3: Company Viewer Read-Only Access**

**Setup:**
```javascript
// Create company viewer for company 1
POST /api/admin/users
{
  "username": "test_company_viewer",
  "email": "viewer@test.com",
  "password": "password123",
  "role": "company_viewer",
  "companyId": 1
}
```

**Tests to Run:**
1. ✅ `GET /api/admin/company` - Should see only company 1
2. ❌ `POST /api/admin/company` - Should be denied
3. ✅ `GET /api/admin/investor-admin` - Should see only company 1 leads
4. ❌ `POST /api/admin/investor-admin` - Should be denied
5. ❌ `PUT /api/admin/investor-admin/:id` - Should be denied
6. ✅ `GET /api/admin/investor-admin/statistics` - Should see company 1 stats

### **Scenario 4: Company Creator Limited Access**

**Setup:**
```javascript
// Create company creator for company 1
POST /api/admin/users
{
  "username": "test_company_creator",
  "email": "creator@test.com",
  "password": "password123",
  "role": "company_creator",
  "companyId": 1
}
```

**Tests to Run:**
1. ✅ `GET /api/admin/company` - Should see only company 1
2. ❌ `POST /api/admin/company` - Should be denied
3. ✅ `GET /api/admin/investor-admin` - Should see only company 1 leads
4. ✅ `POST /api/admin/investor-admin` (companyID: 1) - Should work
5. ❌ `POST /api/admin/investor-admin` (companyID: 2) - Should be denied
6. ❌ `PUT /api/admin/investor-admin/:id` - Should be denied (no update permission)
7. ✅ `POST /api/admin/investor-admin/transfer/:investorId` - Should work for company 1

---

## 📱 Postman Collection Setup

### **1. Environment Variables**
```
base_url: http://localhost:4000
admin_jwt: (leave empty)
user_id: (will be set after login)
current_role: (will be set after login)
company_id: 1
test_company_id: 2
test_investor_id: (will be set)
test_lead_id: (will be set)
```

### **2. Collection Structure**
```
📁 Investor Form Backend API - Role-Based Testing
├── 📁 1. Authentication & User Management
│   ├── 🔐 Login (Database User)
│   ├── 🔐 Login (Legacy Admin)
│   ├── 👤 Get My Profile
│   ├── 👥 Get All Users (Super Admin Only)
│   ├── ➕ Create Super Admin
│   ├── ➕ Create Company Admin
│   ├── ➕ Create Company Viewer
│   ├── ➕ Create Company Creator
│   ├── ✏️ Update User
│   ├── 🗑️ Delete User
│   └── 🚪 Logout
├── 📁 2. Company Management
│   ├── 🏢 Get All Companies
│   ├── 🏢 Get Company by ID
│   ├── ➕ Create Company (Super Only)
│   ├── ✏️ Update Company
│   └── 🗑️ Delete Company
├── 📁 3. Investor Form (Public)
│   ├── 📝 Submit Investor Form
│   └── 📋 Get All Submissions
├── 📁 4. Lead Management
│   ├── 👥 Get All Leads
│   ├── 🔍 Get Leads with Filters
│   ├── ➕ Create Lead
│   ├── ✏️ Update Lead
│   ├── 🔄 Transfer Investor to Lead
│   └── 📊 Get Statistics
├── 📁 5. Role-Based Testing
│   ├── 📁 Super Admin Tests
│   ├── 📁 Company Admin Tests
│   ├── 📁 Company Viewer Tests
│   ├── 📁 Company Creator Tests
│   ├── 📁 Cross-Company Access Tests
│   └── 📁 Permission Denial Tests
└── 📁 6. System
    └── 🏥 Health Check
```

### **3. Pre-request Scripts**

**For All Authenticated Requests:**
```javascript
// Automatically add JWT cookie if available
if (pm.environment.get('admin_jwt')) {
    pm.request.headers.add({
        key: 'Cookie',
        value: `admin_jwt=${pm.environment.get('admin_jwt')}`
    });
}
```

**For Login Requests:**
```javascript
// Clear previous auth data
pm.environment.unset('admin_jwt');
pm.environment.unset('user_id');
pm.environment.unset('current_role');
pm.environment.unset('company_id');
```

### **4. Test Scripts**

**For Login Requests:**
```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
    pm.expect(responseJson.user).to.be.an('object');
});

// Set environment variables
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    if (responseJson.success && responseJson.user) {
        pm.environment.set('user_id', responseJson.user.id);
        pm.environment.set('current_role', responseJson.user.role);
        if (responseJson.user.companyId) {
            pm.environment.set('company_id', responseJson.user.companyId);
        }
        console.log(`Logged in as: ${responseJson.user.username} (${responseJson.user.role})`);
    }
    
    // Extract JWT from cookies
    const cookies = pm.response.headers.get('Set-Cookie');
    if (cookies) {
        const jwtMatch = cookies.match(/admin_jwt=([^;]+)/);
        if (jwtMatch) {
            pm.environment.set('admin_jwt', jwtMatch[1]);
        }
    }
}
```

**For Access Control Tests:**
```javascript
const currentRole = pm.environment.get('current_role');

// Test for successful access
pm.test(`${currentRole} should have access`, function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
});

// Test for denied access
pm.test(`${currentRole} should be denied access`, function () {
    pm.response.to.have.status(403);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.false;
    pm.expect(responseJson.error).to.include('Access denied');
});
```

**For Company Scoped Tests:**
```javascript
const currentRole = pm.environment.get('current_role');
const userCompanyId = pm.environment.get('company_id');

if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    
    // For company-specific roles, verify data is scoped
    if (['company_admin', 'company_viewer', 'company_creator'].includes(currentRole)) {
        pm.test("Data is scoped to user's company", function () {
            if (responseJson.data && Array.isArray(responseJson.data)) {
                responseJson.data.forEach(item => {
                    if (item.companyID) {
                        pm.expect(item.companyID).to.equal(parseInt(userCompanyId));
                    }
                });
            }
        });
    }
}
```

---

## 🎯 Complete Testing Checklist

### **Authentication Testing**
- [ ] Database user login with valid credentials
- [ ] Database user login with invalid credentials
- [ ] Legacy admin login (backward compatibility)
- [ ] JWT cookie handling and automatic inclusion
- [ ] User profile access for all role types
- [ ] Logout functionality

### **User Management Testing (Super Admin Only)**
- [ ] Create users with all 6 different roles
- [ ] Get all users list
- [ ] Get specific user by ID
- [ ] Update user information and roles
- [ ] Delete users (prevent self-deletion)
- [ ] Access denied for non-super-admin roles

### **Role-Based Access Control Testing**

#### **Super Admin Tests**
- [ ] Full access to all user management endpoints
- [ ] Access to all companies and their data
- [ ] Create, read, update, delete permissions for all entities
- [ ] Cross-company data access

#### **Company Admin Tests**
- [ ] Denied access to user management
- [ ] Access only to assigned company data
- [ ] Full CRUD permissions within assigned company
- [ ] Denied access to other companies' data
- [ ] Cannot create new companies

#### **Super Viewer Tests**
- [ ] Read access to all companies and data
- [ ] Denied access to create, update, delete operations
- [ ] Denied access to user management
- [ ] Can view statistics across all companies

#### **Company Viewer Tests**
- [ ] Read access only to assigned company data
- [ ] Denied access to other companies' data
- [ ] Denied access to create, update, delete operations
- [ ] Can view statistics for assigned company only

#### **Super Creator Tests**
- [ ] Create access to all companies
- [ ] Read access to all data
- [ ] Denied access to update and delete operations
- [ ] Can create companies, leads, and transfer investors

#### **Company Creator Tests**
- [ ] Create access only within assigned company
- [ ] Read access to assigned company data
- [ ] Denied access to update and delete operations
- [ ] Cannot create companies
- [ ] Automatic companyID enforcement

### **Company Management Testing**
- [ ] Get companies (role-based filtering)
- [ ] Get specific company (access control)
- [ ] Create company (super roles only)
- [ ] Update company (admin roles only)
- [ ] Delete company (admin roles only)
- [ ] Cross-company access restrictions

### **Investor & Lead Management Testing**
- [ ] Public investor form submission (no auth)
- [ ] Get investor submissions (role-based filtering)
- [ ] Create admin leads (role and company restrictions)
- [ ] Update leads (admin roles only)
- [ ] Transfer investors to leads (role-based)
- [ ] Statistics access (role-based filtering)
- [ ] Company-specific data enforcement

### **Security & Error Handling Testing**
- [ ] Authentication errors (401)
- [ ] Authorization errors (403) for each role
- [ ] Validation errors (400)
- [ ] Not found errors (404)
- [ ] Rate limiting (429)
- [ ] Cross-company access attempts
- [ ] Invalid role assignments

### **Data Isolation Testing**
- [ ] Company 1 user cannot access Company 2 data
- [ ] Company-specific filtering in all endpoints
- [ ] Automatic companyID enforcement for company roles
- [ ] Statistics scoped to user's company
- [ ] Lead creation restricted to user's company

---

## 🚀 Production Testing

### **Environment Variables for Production**
```
base_url: https://your-production-domain.com
admin_jwt: (leave empty)
```

### **Production-Specific Tests**
1. **HTTPS Enforcement** - All requests must use HTTPS
2. **CORS Configuration** - Test with actual frontend domains
3. **Rate Limiting** - Verify rate limiting behavior
4. **Security Headers** - Check Helmet security headers
5. **Database Performance** - Test with realistic data volumes
6. **Role-Based Access** - Verify all role restrictions work in production

---

## 📊 Testing Results Template

Use this template to track your testing results:

```
🧪 ROLE-BASED ACCESS CONTROL TESTING RESULTS

📋 Test Environment:
- Base URL: http://localhost:4000
- Test Date: [DATE]
- Tester: [NAME]

🎭 User Roles Created:
- [ ] super_admin: test_super_admin
- [ ] company_admin: test_company_admin (Company 1)
- [ ] super_viewer: test_super_viewer
- [ ] company_viewer: test_company_viewer (Company 1)
- [ ] super_creator: test_super_creator
- [ ] company_creator: test_company_creator (Company 1)

✅ SUPER_ADMIN Tests:
- [ ] User Management: ✅ Full Access
- [ ] Company Management: ✅ All Companies
- [ ] Lead Management: ✅ All Leads
- [ ] Cross-Company Access: ✅ Allowed

✅ COMPANY_ADMIN Tests:
- [ ] User Management: ❌ Denied (Expected)
- [ ] Company Management: ✅ Company 1 Only
- [ ] Lead Management: ✅ Company 1 Only
- [ ] Cross-Company Access: ❌ Denied (Expected)

✅ COMPANY_VIEWER Tests:
- [ ] Read Access: ✅ Company 1 Only
- [ ] Write Access: ❌ Denied (Expected)
- [ ] Statistics: ✅ Company 1 Only

✅ COMPANY_CREATOR Tests:
- [ ] Create Access: ✅ Company 1 Only
- [ ] Update Access: ❌ Denied (Expected)
- [ ] Company Creation: ❌ Denied (Expected)

🔒 Security Tests:
- [ ] Cross-Company Data Access: ❌ Properly Blocked
- [ ] Role Escalation: ❌ Properly Blocked
- [ ] Invalid Authentication: ❌ Properly Blocked
```

---

This comprehensive documentation covers every aspect of testing your enterprise-grade role-based authentication system. Use it to create a complete Postman collection and verify that all user roles work exactly as designed! 🎯🔒
