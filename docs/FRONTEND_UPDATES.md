# Frontend Updates - User Management API Changes

## 📋 Overview
This document outlines the recent updates to the User Management API that affect how super admins are handled in the frontend.

---

## 🆕 New Features & Changes

### 1. **Super Admin Company Assignment (Optional)**

**Change:** Super admins (`super_admin`, `super_viewer`, `super_creator`) no longer require a `companyId` assignment. They can have `companyId: null`.

**Impact:**
- When creating a super admin user, `companyId` can be `null` or omitted
- When updating a super admin user, `companyId` can be set to `null` to remove company assignment
- Super admins can access all companies regardless of their `companyId` value

**API Behavior:**
- **Create User (POST `/api/admin/users`)**: 
  - Super roles: `companyId` is optional and can be `null`
  - Company roles: `companyId` is **required** (must be a positive integer)

- **Update User (PUT `/api/admin/users/:id`)**:
  - Super roles: `companyId` can be `null` or any valid company ID
  - Company roles: `companyId` is **required** (must be a positive integer)

**Example Request - Create Super Admin:**
```json
POST /api/admin/users
{
  "username": "super_admin_user",
  "email": "admin@example.com",
  "password": "securepassword123",
  "role": "super_admin",
  "companyId": null  // ✅ Allowed for super_admin
}
```

**Example Request - Update Super Admin (Remove Company):**
```json
PUT /api/admin/users/:id
{
  "companyId": null  // ✅ Can set to null for super_admin
}
```

**Example Request - Create Company Admin:**
```json
POST /api/admin/users
{
  "username": "company_admin_user",
  "email": "company@example.com",
  "password": "securepassword123",
  "role": "company_admin",
  "companyId": 1  // ✅ Required for company_admin
}
```

---

### 2. **Password Update for Super Admins**

**Change:** Super admins can now update passwords for any user (including themselves and other users).

**Impact:**
- When updating a user, super admins can include a `password` field
- The password will be automatically hashed before storage
- Password updates work for all user roles

**API Behavior:**
- **Update User (PUT `/api/admin/users/:id`)**:
  - `password` field is optional
  - If provided, must be at least 6 characters
  - Password is automatically hashed (no need to hash on frontend)

**Example Request - Update User Password:**
```json
PUT /api/admin/users/:id
{
  "password": "newSecurePassword123"  // ✅ Super admin can update any user's password
}
```

**Example Request - Update Multiple Fields Including Password:**
```json
PUT /api/admin/users/:id
{
  "username": "updated_username",
  "email": "updated@example.com",
  "password": "newPassword123",  // ✅ Can update password along with other fields
  "role": "super_admin",
  "companyId": null
}
```

---

## 🔧 Frontend Implementation Guidelines

### **1. User Creation Form**

**For Super Admin Users:**
```typescript
// Super admin form should allow companyId to be null
interface CreateSuperAdminForm {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'super_viewer' | 'super_creator';
  companyId: number | null; // ✅ Can be null
}

// Validation
if (isSuperRole(role)) {
  // companyId is optional - can be null or a number
  // Show company selector as optional
} else {
  // companyId is required - must be a number
  // Show company selector as required
}
```

**For Company Role Users:**
```typescript
// Company role form must require companyId
interface CreateCompanyUserForm {
  username: string;
  email: string;
  password: string;
  role: 'company_admin' | 'company_viewer' | 'company_creator';
  companyId: number; // ✅ Required (not null)
}
```

### **2. User Update Form**

**Password Update Field:**
```typescript
interface UpdateUserForm {
  username?: string;
  email?: string;
  password?: string; // ✅ Super admin can update password
  role?: UserRole;
  companyId?: number | null; // ✅ Can be null for super roles
  isActive?: boolean;
}

// Show password field in update form for super admins
{isSuperAdmin && (
  <PasswordField
    label="New Password (optional)"
    onChange={(value) => setFormData({ ...formData, password: value })}
    validation={{ minLength: 6 }}
  />
)}
```

### **3. Company ID Field Handling**

```typescript
// Conditional rendering based on role
const isSuperRole = (role: string) => 
  ['super_admin', 'super_viewer', 'super_creator'].includes(role);

const isCompanyRole = (role: string) => 
  ['company_admin', 'company_viewer', 'company_creator'].includes(role);

// In your form component
<CompanySelector
  value={formData.companyId}
  onChange={(value) => setFormData({ ...formData, companyId: value })}
  required={isCompanyRole(formData.role)} // ✅ Required only for company roles
  allowNull={isSuperRole(formData.role)}  // ✅ Allow null for super roles
  placeholder={isSuperRole(formData.role) 
    ? "Select company (optional)" 
    : "Select company (required)"}
/>
```

### **4. API Request Examples**

**Create Super Admin (TypeScript/JavaScript):**
```typescript
const createSuperAdmin = async (userData: CreateSuperAdminForm) => {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookie-based auth
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      companyId: userData.companyId ?? null, // ✅ Explicitly set to null if undefined
    }),
  });
  return response.json();
};
```

**Update User with Password:**
```typescript
const updateUser = async (userId: string, updates: UpdateUserForm) => {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...updates,
      // If password is provided, send it (will be hashed on backend)
      ...(updates.password && { password: updates.password }),
      // If companyId should be null for super role, explicitly set it
      ...(updates.companyId === null && { companyId: null }),
    }),
  });
  return response.json();
};
```

---

## ✅ Validation Rules Summary

### **Create User (POST `/api/admin/users`)**
| Field | Super Roles | Company Roles |
|-------|------------|---------------|
| `username` | Required (min 3 chars) | Required (min 3 chars) |
| `email` | Required (valid email) | Required (valid email) |
| `password` | Required (min 6 chars) | Required (min 6 chars) |
| `role` | Required | Required |
| `companyId` | **Optional** (can be `null`) | **Required** (must be positive integer) |

### **Update User (PUT `/api/admin/users/:id`)**
| Field | Super Roles | Company Roles |
|-------|------------|---------------|
| `username` | Optional | Optional |
| `email` | Optional | Optional |
| `password` | **Optional** (min 6 chars if provided) | **Optional** (min 6 chars if provided) |
| `role` | Optional | Optional |
| `companyId` | **Optional** (can be `null`) | **Required** (must be positive integer) |
| `isActive` | Optional | Optional |

**Important Notes:**
- If updating a user to a company role, `companyId` becomes required
- If updating a user to a super role, `companyId` can be set to `null`
- Password updates are only available to super admins
- All fields are validated on the backend

---

## 🚨 Error Handling

### **Common Error Responses:**

**1. Company Role Without Company ID:**
```json
{
  "success": false,
  "error": "Company roles (company_admin) must have a companyId assigned"
}
```

**2. Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["password"],
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**3. Duplicate Username/Email:**
```json
{
  "success": false,
  "error": "Username or email already exists"
}
```

---

## 📝 Testing Checklist

- [ ] Create super admin with `companyId: null`
- [ ] Create super admin with `companyId: 1` (should work)
- [ ] Create company admin without `companyId` (should fail)
- [ ] Update super admin password
- [ ] Update company admin password (as super admin)
- [ ] Update user role from company to super (should allow `companyId: null`)
- [ ] Update user role from super to company (should require `companyId`)

---

## 🔗 Related Endpoints

- **POST** `/api/admin/users` - Create user
- **PUT** `/api/admin/users/:id` - Update user
- **GET** `/api/admin/users` - List all users
- **GET** `/api/admin/users/:id` - Get user by ID
- **GET** `/api/admin/users/me/profile` - Get current user profile

---

## 📞 Support

If you encounter any issues or have questions about these updates, please contact the backend team.

**Last Updated:** November 2025

