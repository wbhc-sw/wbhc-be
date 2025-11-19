# User Roles and API Access Control Guide

## 🎯 Overview

This document provides a **complete reference** for the role-based access control (RBAC) system implemented in the Investor Form Backend. The system includes **6 distinct user roles** with **fine-grained permissions** and **company-scoped access control**.

---

## 🔐 User Roles Hierarchy

### **SUPER Roles (Global Access)**
- ✅ Can access **all companies** and **all data**
- ✅ **No company restrictions**

### **COMPANY Roles (Company-Scoped Access)**  
- ⚠️ Can **only access their assigned company's data**
- ⚠️ **Must have `companyId` assigned**

---

## 📋 Role Definitions

| Role | Scope | Read | Create | Update | Delete | User Management |
|------|-------|------|--------|--------|--------|----------------|
| `SUPER_ADMIN` | **Global** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ Full Access |
| `COMPANY_ADMIN` | **Company** | ✅ Company Only | ✅ Company Only | ✅ Company Only | ✅ Company Only | ❌ No Access |
| `SUPER_VIEWER` | **Global** | ✅ All | ❌ None | ❌ None | ❌ None | ❌ No Access |
| `COMPANY_VIEWER` | **Company** | ✅ Company Only | ❌ None | ❌ None | ❌ None | ❌ No Access |
| `SUPER_CREATOR` | **Global** | ✅ All | ✅ All | ❌ None | ❌ None | ❌ No Access |
| `COMPANY_CREATOR` | **Company** | ✅ Company Only | ✅ Company Only | ❌ None | ❌ None | ❌ No Access |

---

## 🔑 Role Permissions Matrix

### **SUPER_ADMIN** - *Ultimate Access*
```yaml
Scope: Global (All Companies)
Permissions:
  ✅ READ: Everything
  ✅ CREATE: Everything  
  ✅ UPDATE: Everything
  ✅ DELETE: Everything
  ✅ USER_MANAGEMENT: Full control
Special: Can manage all users and companies
```

### **COMPANY_ADMIN** - *Company Manager*
```yaml
Scope: Single Company (companyId required)
Permissions:
  ✅ READ: Company data only
  ✅ CREATE: Company data only
  ✅ UPDATE: Company data only
  ✅ DELETE: Company data only
  ❌ USER_MANAGEMENT: No access
Special: Full control within assigned company
```

### **SUPER_VIEWER** - *Global Read-Only*
```yaml
Scope: Global (All Companies)
Permissions:
  ✅ READ: Everything
  ❌ CREATE: Nothing
  ❌ UPDATE: Nothing
  ❌ DELETE: Nothing
  ❌ USER_MANAGEMENT: No access
Special: Can view all data but cannot modify
```

### **COMPANY_VIEWER** - *Company Read-Only*
```yaml
Scope: Single Company (companyId required)
Permissions:
  ✅ READ: Company data only
  ❌ CREATE: Nothing
  ❌ UPDATE: Nothing
  ❌ DELETE: Nothing
  ❌ USER_MANAGEMENT: No access
Special: Read-only access to assigned company
```

### **SUPER_CREATOR** - *Global Creator*
```yaml
Scope: Global (All Companies)
Permissions:
  ✅ READ: Everything
  ✅ CREATE: Everything
  ❌ UPDATE: Nothing
  ❌ DELETE: Nothing
  ❌ USER_MANAGEMENT: No access
Special: Can create new data anywhere but cannot modify existing
```

### **COMPANY_CREATOR** - *Company Creator*
```yaml
Scope: Single Company (companyId required)
Permissions:
  ✅ READ: Company data only
  ✅ CREATE: Company data only
  ❌ UPDATE: Nothing
  ❌ DELETE: Nothing
  ❌ USER_MANAGEMENT: No access
Special: Can create new data in assigned company only
```

---

## 🛡️ API Endpoints Access Control

### **1. User Management APIs** (`/api/admin/users/`)

| Endpoint | Method | Access | Description |
|----------|---------|---------|-------------|
| `/login` | POST | **Public** | User login |
| `/logout` | POST | **Authenticated** | User logout |
| `/me/profile` | GET | **Authenticated** | Get own profile |
| `/` | GET | **SUPER_ADMIN only** | List all users |
| `/` | POST | **SUPER_ADMIN only** | Create new user |
| `/:id` | GET | **SUPER_ADMIN only** | Get user by ID |
| `/:id` | PUT | **SUPER_ADMIN only** | Update user |
| `/:id` | DELETE | **SUPER_ADMIN only** | Delete user |

### **2. Company Management APIs** (`/api/admin/company/`)

| Endpoint | Method | Super Admin | Company Admin | Super Viewer | Company Viewer | Super Creator | Company Creator |
|----------|---------|-------------|---------------|--------------|----------------|---------------|-----------------|
| `GET /` | Read All | ✅ All Companies | ✅ Own Company | ✅ All Companies | ✅ Own Company | ✅ All Companies | ✅ Own Company |
| `POST /` | Create | ✅ Any Company | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ✅ Any Company | ❌ Forbidden |
| `GET /:id` | Read One | ✅ Any Company | ✅ Own Company | ✅ Any Company | ✅ Own Company | ✅ Any Company | ✅ Own Company |
| `PUT /:id` | Update | ✅ Any Company | ✅ Own Company | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| `DELETE /:id` | Delete | ✅ Any Company | ✅ Own Company | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |

### **3. Investor Admin (Leads) APIs** (`/api/admin/investor-admin/`)

| Endpoint | Method | Super Admin | Company Admin | Super Viewer | Company Viewer | Super Creator | Company Creator |
|----------|---------|-------------|---------------|--------------|----------------|---------------|-----------------|
| `GET /` | Read All | ✅ All Companies | ✅ Own Company | ✅ All Companies | ✅ Own Company | ✅ All Companies | ✅ Own Company |
| `POST /` | Create | ✅ Any Company | ✅ Own Company | ❌ Forbidden | ❌ Forbidden | ✅ Any Company | ✅ Own Company |
| `GET /:id` | Read One | ✅ Any Lead | ✅ Own Company | ✅ Any Lead | ✅ Own Company | ✅ Any Lead | ✅ Own Company |
| `PUT /:id` | Update | ✅ Any Lead | ✅ Own Company | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| `DELETE /:id` | Delete | ✅ Any Lead | ✅ Own Company | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |

### **4. Investor Form APIs** (`/api/investor/`)

| Endpoint | Method | Access | Description |
|----------|---------|---------|-------------|
| `POST /` | Create | **Public** | Submit investor form (public endpoint) |
| `GET /` | Read All | **Authenticated + Read Permissions** | Get all investors |

### **5. Legacy Admin APIs** (`/api/admin/`)

| Endpoint | Method | Access | Description |
|----------|---------|---------|-------------|
| `/login` | POST | **Public** | Legacy admin login |
| `/logout` | POST | **Public** | Legacy admin logout |

---

## 🔒 Company-Scoped Access Control

### **How Company Scoping Works:**

1. **Company Roles** (`COMPANY_*`) **MUST** have a `companyId` assigned
2. **Super Roles** (`SUPER_*`) can access **all companies**
3. **Automatic Filtering**: Company roles automatically see only their company's data
4. **Automatic Assignment**: When company roles create data, it's automatically assigned to their company

### **Example Scenarios:**

#### ✅ **Valid Access:**
```bash
# User: company_creator with companyId: 1
POST /api/admin/investor-admin/
{
  "companyID": 1,  # ✅ Matches user's companyId
  "fullName": "John Doe"
}
```

#### ❌ **Blocked Access:**
```bash
# User: company_creator with companyId: 1
POST /api/admin/investor-admin/
{
  "companyID": 2,  # ❌ Different from user's companyId
  "fullName": "John Doe"
}
# Returns: 403 Forbidden - Company access denied
```

---

## 🚨 Security Features

### **1. JWT Authentication**
- **HttpOnly Cookies** - Prevents XSS attacks
- **24-hour Expiration** - Automatic logout
- **Secure & SameSite** - CSRF protection

### **2. Role-Based Middleware**
- **Pre-route Validation** - Checks permissions before endpoint execution
- **Dynamic Filtering** - Automatically filters data based on company scope
- **Error Handling** - Clear 403/401 responses for unauthorized access

### **3. Data Validation**
- **Zod Schemas** - Input validation and sanitization
- **XSS Protection** - Content sanitization
- **Type Safety** - TypeScript interfaces

### **4. Company Isolation**
- **Automatic Scoping** - Company roles cannot access other companies
- **Data Segregation** - Database-level filtering
- **Audit Trail** - All actions logged with user context

---

## 🧪 Testing Role-Based Access

### **Test User Creation:**
```bash
# Create users with different roles for testing
POST /api/admin/users/
{
  "username": "super_admin_user",
  "email": "super@company.com",
  "password": "password123",
  "role": "super_admin"
}

POST /api/admin/users/
{
  "username": "company1_admin",
  "email": "admin@company1.com", 
  "password": "password123",
  "role": "company_admin",
  "companyId": 1
}
```

### **Access Testing Scenarios:**

#### **Scenario 1: Super Admin Access**
```bash
# Login as super_admin
POST /api/admin/users/login
{"username": "super_admin_user", "password": "password123"}

# Should succeed - access all companies
GET /api/admin/company/
GET /api/admin/investor-admin/
```

#### **Scenario 2: Company Admin Access**
```bash  
# Login as company_admin (companyId: 1)
POST /api/admin/users/login
{"username": "company1_admin", "password": "password123"}

# Should succeed - access only company 1 data
GET /api/admin/company/  # Only shows company 1
GET /api/admin/investor-admin/  # Only shows company 1 leads

# Should fail - cannot create for different company
POST /api/admin/investor-admin/
{"companyID": 2, "fullName": "Test"}  # 403 Forbidden
```

#### **Scenario 3: Viewer Access**
```bash
# Login as company_viewer
POST /api/admin/users/login  
{"username": "viewer_user", "password": "password123"}

# Should succeed - read access
GET /api/admin/company/
GET /api/admin/investor-admin/

# Should fail - no create/update/delete access  
POST /api/admin/company/  # 403 Forbidden
PUT /api/admin/company/1  # 403 Forbidden
DELETE /api/admin/company/1  # 403 Forbidden
```

---

## 📝 Best Practices

### **1. User Assignment**
- Always assign `companyId` to company roles
- Leave `companyId` as `null` for super roles
- Validate company exists before assignment

### **2. Role Selection Guidelines**
- **SUPER_ADMIN**: System administrators only
- **COMPANY_ADMIN**: Company managers with full company access
- **SUPER_VIEWER**: Auditors, analysts with read-only global access
- **COMPANY_VIEWER**: Company staff with read-only access
- **SUPER_CREATOR**: Data entry specialists with global create access
- **COMPANY_CREATOR**: Company data entry staff

### **3. Security Considerations**
- Regularly audit user permissions
- Use principle of least privilege
- Monitor failed access attempts
- Implement session timeouts
- Enable account deactivation when needed

---

## 🔧 Implementation Notes

### **Role Constants:**
```typescript
// Defined in src/middleware/roleAuth.ts
ROLES_THAT_CAN_READ = [all roles]
ROLES_THAT_CAN_CREATE = [admin, creator roles]  
ROLES_THAT_CAN_UPDATE = [admin roles only]
ROLES_THAT_CAN_DELETE = [admin roles only]
```

### **Company Access Validation:**
```typescript
// Automatic company scoping for company roles
if (isCompanyRole(user.role)) {
  if (!user.companyId) {
    return 403; // No company assigned
  }
  whereClause.companyID = user.companyId;
}
```

This role-based access control system provides **enterprise-grade security** with **fine-grained permissions** and **company-level data isolation**, ensuring that users can only access the data they're authorized to see and modify.
