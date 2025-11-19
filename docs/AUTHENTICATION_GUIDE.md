# 🔐 Authentication & Authorization Guide

## 📋 Overview

This backend uses **JWT-based authentication with HttpOnly cookies** for secure admin access. There are **NO Bearer tokens** - everything is handled automatically through cookies.

## 🏗️ Architecture

### **Authentication Flow**
```
1. Admin Login → JWT generated → HttpOnly cookie set
2. All requests → Cookie automatically sent
3. Middleware → Validates JWT from cookie
4. Access granted/denied → Based on JWT validity
```

### **Security Features**
- **HttpOnly cookies** (cannot be accessed by JavaScript)
- **Secure flag** (HTTPS only in production)
- **SameSite=Strict** (CSRF protection)
- **JWT expiration** (configurable)
- **Rate limiting** (prevents brute force)

## 🔧 Implementation Details

### **1. JWT Middleware (`src/middleware/jwtAuth.ts`)**

```typescript
// Extracts JWT from admin_jwt cookie
const token = req.cookies?.admin_jwt;

// Verifies JWT signature and expiration
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Adds user info to request object
req.user = decoded;
```

### **2. Cookie Settings**

```typescript
// Set during login
res.cookie('admin_jwt', token, {
  httpOnly: true,           // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',       // CSRF protection
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

// Clear during logout
res.clearCookie('admin_jwt');
```

### **3. Protected Routes**

```typescript
// Apply middleware to protect routes
router.get('/admin/company', jwtAuth, async (req, res) => {
  // Only authenticated admins can access
});

// Multiple middleware can be chained
router.post('/admin/company', [jwtAuth, validation], async (req, res) => {
  // JWT validation + input validation
});
```

## 🚀 How to Use

### **For Frontend Developers**

#### **1. Login Request**
```javascript
// POST to /api/admin/login
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // IMPORTANT: Include cookies
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

// Cookie automatically set - no manual handling needed
```

#### **2. Authenticated Requests**
```javascript
// All subsequent requests automatically include the cookie
const companies = await fetch('/api/admin/company', {
  method: 'GET',
  credentials: 'include' // IMPORTANT: Include cookies
});

// No need to manually add Authorization header
// No need to manually extract or send tokens
```

#### **3. Logout**
```javascript
// POST to /api/admin/logout
await fetch('/api/admin/logout', {
  method: 'POST',
  credentials: 'include' // Include cookies to clear them
});

// Cookie automatically cleared
```

### **For Postman Users**

#### **1. Enable Cookies**
- Go to **Settings** → **General**
- Enable **"Automatically follow redirects"**
- Enable **"Send cookies with requests"**

#### **2. Login First**
```
POST http://localhost:4000/api/admin/login
Body: {"username": "admin", "password": "admin123"}
```

#### **3. All Other Requests**
- **No manual cookie handling needed**
- **No Authorization headers needed**
- **Cookies automatically sent**

## 🛡️ Security Best Practices

### **1. Environment Variables**
```bash
# Required
JWT_SECRET=your-super-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Optional (for production)
NODE_ENV=production
COOKIE_SECRET=additional-cookie-security
```

### **2. Production Security**
```typescript
// Cookies become secure in production
secure: process.env.NODE_ENV === 'production'

// Use strong JWT secret
JWT_SECRET=64+ character random string
```

### **3. Rate Limiting**
```typescript
// Prevents brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. "Unauthorized" Errors**
- **Check if logged in** → Login first
- **Check cookie settings** → Ensure `credentials: 'include'`
- **Check JWT expiration** → Re-login if expired

#### **2. Cookies Not Sent**
- **Frontend**: Ensure `credentials: 'include'`
- **Postman**: Enable cookie sending in settings
- **CORS**: Check if `credentials: true` is set

#### **3. JWT Expired**
- **Automatic**: JWT expires after 24 hours
- **Solution**: Re-login to get new JWT
- **Prevention**: Implement refresh token if needed

### **Debug Steps**
```typescript
// Add to your routes for debugging
console.log('Cookies:', req.cookies);
console.log('User:', req.user);
```

## 📚 API Reference

### **Public Endpoints (No Auth)**
- `POST /api/admin/login` - Admin login
- `POST /api/investor-form` - Submit investor form
- `GET /health` - Health check

### **Protected Endpoints (Auth Required)**
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/company` - Get companies
- `POST /api/admin/company` - Create company
- `PUT /api/admin/company/:id` - Update company
- `DELETE /api/admin/company/:id` - Delete company
- `GET /api/investor-form` - Get all submissions
- `GET /api/admin/investor-admin` - Get all leads
- `POST /api/admin/investor-admin` - Create lead
- `PUT /api/admin/investor-admin/:id` - Update lead
- `POST /api/admin/investor-admin/transfer/:id` - Transfer submission
- `GET /api/admin/investor-admin/statistics` - Get statistics

## 🎯 Key Points to Remember

1. **NO Bearer tokens** - Only HttpOnly cookies
2. **NO manual token handling** - Everything automatic
3. **ALWAYS use `credentials: 'include'`** in frontend
4. **Login first** before accessing protected routes
5. **Cookies automatically sent** with every request
6. **JWT expires after 24 hours** - re-login needed
7. **HttpOnly prevents XSS** attacks
8. **SameSite prevents CSRF** attacks

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] HttpOnly cookies enabled
- [ ] Secure flag in production
- [ ] SameSite=Strict set
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS in production
- [ ] Regular JWT secret rotation

---

**Remember**: Your system is designed to be **simple and secure**. No manual token management needed - just login and let cookies handle the rest! 🎉
