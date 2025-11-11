# Quick Reference - User Management API Updates

## 🎯 Key Changes

### 1. Super Admin Company Assignment (Optional)
- **Super roles** (`super_admin`, `super_viewer`, `super_creator`) can have `companyId: null`
- **Company roles** (`company_admin`, `company_viewer`, `company_creator`) **must** have a `companyId`

### 2. Password Updates
- **Super admins** can update passwords for any user via the update endpoint

---

## 📝 API Examples

### Create Super Admin (companyId optional)
```json
POST /api/admin/users
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "super_admin",
  "companyId": null  // ✅ Optional - can be null
}
```

### Create Company Admin (companyId required)
```json
POST /api/admin/users
{
  "username": "company_user",
  "email": "user@example.com",
  "password": "password123",
  "role": "company_admin",
  "companyId": 1  // ✅ Required - must be a number
}
```

### Update User Password (Super Admin only)
```json
PUT /api/admin/users/:id
{
  "password": "newPassword123"  // ✅ Super admin can update any user's password
}
```

### Update User - Remove Company Assignment
```json
PUT /api/admin/users/:id
{
  "role": "super_admin",
  "companyId": null  // ✅ Can set to null for super roles
}
```

---

## ⚠️ Validation Rules

| Role Type | companyId Required? | Can be null? |
|-----------|-------------------|--------------|
| `super_admin` | ❌ No | ✅ Yes |
| `super_viewer` | ❌ No | ✅ Yes |
| `super_creator` | ❌ No | ✅ Yes |
| `company_admin` | ✅ Yes | ❌ No |
| `company_viewer` | ✅ Yes | ❌ No |
| `company_creator` | ✅ Yes | ❌ No |

---

## 🔧 Frontend Implementation

```typescript
// Check if role is super role
const isSuperRole = (role: string) => 
  ['super_admin', 'super_viewer', 'super_creator'].includes(role);

// In form validation
if (isSuperRole(formData.role)) {
  // companyId is optional - can be null
} else {
  // companyId is required - must be a number
}

// Password update (super admin only)
if (currentUser.role === 'super_admin') {
  // Show password field in update form
}
```

---

## ❌ Common Errors

**Error:** `"Company roles (company_admin) must have a companyId assigned"`
**Solution:** Provide a valid `companyId` when creating/updating company role users

**Error:** `"Validation failed"` for password
**Solution:** Password must be at least 6 characters

---

For detailed documentation, see `FRONTEND_UPDATES.md`

