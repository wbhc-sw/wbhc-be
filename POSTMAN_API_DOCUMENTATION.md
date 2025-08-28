# Complete API Documentation - Postman Testing Guide

## 🚀 Investor Form Backend API

This document provides comprehensive API documentation for testing all endpoints using Postman. The system includes investor form submissions, company management, lead management, and admin authentication.

---

## 📋 Quick Start Guide

### 1. **Environment Setup**
Create a Postman environment with these variables:
```
base_url: http://localhost:4000
admin_jwt: (leave empty - will be set after login)
```

### 2. **Authentication Flow**
1. Login with admin credentials
2. JWT token automatically set as HttpOnly cookie
3. All subsequent requests automatically include the cookie

---

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `http://localhost:4000/api/admin/login` | Admin authentication | ❌ |
| `POST` | `http://localhost:4000/api/admin/logout` | Admin logout | ✅ JWT |
| `GET` | `http://localhost:4000/api/admin/company` | Get all companies | ✅ JWT |
| `GET` | `http://localhost:4000/api/admin/company/:companyID` | Get specific company | ✅ JWT |
| `POST` | `http://localhost:4000/api/admin/company` | Create new company | ✅ JWT |
| `PUT` | `http://localhost:4000/api/admin/company/:companyID` | Update company | ✅ JWT |
| `POST` | `http://localhost:4000/api/investor-form` | Submit investor form | ❌ |
| `GET` | `http://localhost:4000/api/investor-form` | Get all submissions | ✅ JWT |
| `GET` | `http://localhost:4000/api/admin/investor-admin` | Get all leads | ✅ JWT |
| `POST` | `http://localhost:4000/api/admin/investor-admin` | Create new lead | ✅ JWT |
| `PUT` | `http://localhost:4000/api/admin/investor-admin/:id` | Update lead | ✅ JWT |
| `POST` | `http://localhost:4000/api/admin/investor-admin/transfer/:investorId` | Transfer submission | ✅ JWT |
| `GET` | `http://localhost:4000/api/admin/investor-admin/statistics` | Get statistics | ✅ JWT |
| `GET` | `http://localhost:4000/health` | Health check | ❌ |

---

## 🔐 Authentication Endpoints

### **POST http://localhost:4000/api/admin/login**
**Description:** Authenticate as admin user

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Expected Response (200):**
```json
{
  "success": true
}
```

**Notes:**
- JWT token is automatically set as HttpOnly cookie
- Use `credentials: 'include'` in Postman settings
- No need to manually extract token

---

### **POST http://localhost:4000/api/admin/logout**
**Description:** Logout and clear authentication

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**Expected Response (200):**
```json
{
  "success": true
}
```

---

## 🏢 Company Management Endpoints

### **GET http://localhost:4000/api/admin/company**
**Description:** Retrieve all companies

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**Expected Response (200):**
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

**Error Response (401):**
```json
{
  "success": false,
  "error": "Missing authentication cookie"
}
```

---

### **GET http://localhost:4000/api/admin/company/:companyID**
**Description:** Retrieve specific company by ID

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**URL Parameters:**
```
companyID: 1
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "companyID": 1,
    "name": "Grab Company",
    "description": "Main company for Grab investments",
    "phoneNumber": "+966501234567",
    "url": "https://grab.sa",
    "createdAt": "2025-08-27T10:57:22.882Z",
    "updatedAt": "2025-08-27T10:57:22.882Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid company ID"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Company not found"
}
```

---

### **POST http://localhost:4000/api/admin/company**
**Description:** Create new company

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={your-jwt-token}
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

**Field Validation:**
- **name**: Required, min 1 character
- **description**: Optional
- **phoneNumber**: Optional, format: `+1234567890`, `+1-234-567-8900`
- **url**: Optional, valid URL format

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

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "Company name is required"
    },
    {
      "path": ["phoneNumber"],
      "message": "Invalid phone number format"
    }
  ]
}
```

---

### **PUT http://localhost:4000/api/admin/company/:companyID**
**Description:** Update existing company

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={your-jwt-token}
```

**URL Parameters:**
```
companyID: 1
```

**Body (raw JSON):**
```json
{
  "name": "Updated Company Name",
  "phoneNumber": "+1987654321"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "companyID": 1,
    "name": "Updated Company Name",
    "description": "Main company for Grab investments",
    "phoneNumber": "+1987654321",
    "url": "https://grab.sa",
    "createdAt": "2025-08-27T10:57:22.882Z",
    "updatedAt": "2025-08-27T11:45:30.123Z"
  }
}
```

---

## 📝 Investor Form Endpoints

### **POST http://localhost:4000/api/investor-form**
**Description:** Submit new investor inquiry (Public endpoint)

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

**Field Validation:**
- **fullName**: Required, min 1 character
- **phoneNumber**: Required, format: `+966501234567`
- **companyID**: Optional, positive integer
- **sharesQuantity**: Required, positive integer
- **calculatedTotal**: Required, positive number
- **city**: Required, min 1 character

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

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["fullName"],
      "message": "Full name is required"
    },
    {
      "path": ["phoneNumber"],
      "message": "Invalid phone number format"
    }
  ]
}
```

---

### **GET http://localhost:4000/api/investor-form**
**Description:** Retrieve all investor submissions (Admin only)

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**Expected Response (200):**
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
      "submissionStatus": "received",
      "createdAt": "2025-08-27T11:04:05.470Z",
      "updatedAt": "2025-08-27T11:04:05.470Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false
    }
  ]
}
```

---

## 👥 Admin Lead Management Endpoints

### **GET http://localhost:4000/api/admin/investor-admin**
**Description:** Retrieve all admin leads

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**Expected Response (200):**
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
      "investmentAmount": 5000,
      "city": "Riyadh",
      "submissionStatus": "received",
      "notes": "VIP lead",
      "callingTimes": 2,
      "leadStatus": "contacted",
      "originalInvestorId": "original-uuid",
      "createdAt": "2025-08-27T11:04:05.470Z",
      "updatedAt": "2025-08-27T11:04:05.470Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false
    }
  ]
}
```

---

### **POST http://localhost:4000/api/admin/investor-admin**
**Description:** Create new admin lead

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={your-jwt-token}
```

**Body (raw JSON):**
```json
{
  "fullName": "Jane Smith",
  "phoneNumber": "+15551234567",
  "companyID": 2,
  "sharesQuantity": 200,
  "calculatedTotal": 10000,
  "investmentAmount": 10000,
  "city": "San Francisco",
  "notes": "High potential lead",
  "callingTimes": 0,
  "leadStatus": "new"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "fullName": "Jane Smith",
    "phoneNumber": "+15551234567",
    "companyID": 2,
    "sharesQuantity": 200,
    "calculatedTotal": 10000,
    "investmentAmount": 10000,
    "city": "San Francisco",
    "notes": "High potential lead",
    "callingTimes": 0,
    "leadStatus": "new",
    "createdAt": "2025-08-27T11:04:05.470Z",
    "updatedAt": "2025-08-27T11:04:05.470Z"
  }
}
```

---

### **PUT http://localhost:4000/api/admin/investor-admin/:id**
**Description:** Update existing admin lead

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={your-jwt-token}
```

**URL Parameters:**
```
id: uuid-string
```

**Body (raw JSON):**
```json
{
  "notes": "Called twice, interested in follow-up",
  "callingTimes": 2,
  "leadStatus": "contacted",
  "investmentAmount": 15000
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "fullName": "Jane Smith",
    "notes": "Called twice, interested in follow-up",
    "callingTimes": 2,
    "leadStatus": "contacted",
    "investmentAmount": 15000,
    "updatedAt": "2025-08-27T11:45:30.123Z"
  }
}
```

---

### **POST http://localhost:4000/api/admin/investor-admin/transfer/:investorId**
**Description:** Transfer public investor submission to admin lead management

**Headers:**
```
Content-Type: application/json
Cookie: admin_jwt={your-jwt-token}
```

**URL Parameters:**
```
investorId: uuid-string
```

**Body (raw JSON):**
```json
{
  "notes": "Initial admin notes about this lead"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-admin-lead-uuid",
    "fullName": "John Doe",
    "companyID": 1,
    "notes": "Initial admin notes about this lead",
    "callingTimes": 0,
    "leadStatus": "new",
    "originalInvestorId": "original-investor-uuid",
    "createdAt": "2025-08-27T11:04:05.470Z",
    "updatedAt": "2025-08-27T11:04:05.470Z"
  }
}
```

---

### **GET http://localhost:4000/api/admin/investor-admin/statistics**
**Description:** Get investment amount statistics

**Headers:**
```
Cookie: admin_jwt={your-jwt-token}
```

**Expected Response (200):**
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

---

## 🏥 Health Check Endpoint

### **GET http://localhost:4000/health**
**Description:** Health check for monitoring

**Expected Response (200):**
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

---

## 📱 Postman Collection Setup

### **1. Create Collection**
- Name: "Investor Form Backend API"
- Description: "Complete API testing for investor form backend"

### **2. Environment Variables**
```
base_url: http://localhost:4000
admin_jwt: (leave empty)
```

### **3. Example Request URLs**
```
Authentication:
- Login: http://localhost:4000/api/admin/login
- Logout: http://localhost:4000/api/admin/logout

Company Management:
- Get All: http://localhost:4000/api/admin/company
- Get One: http://localhost:4000/api/admin/company/1
- Create: http://localhost:4000/api/admin/company
- Update: http://localhost:4000/api/admin/company/1

Investor Form:
- Submit: http://localhost:4000/api/investor-form
- Get All: http://localhost:4000/api/investor-form

Lead Management:
- Get All: http://localhost:4000/api/admin/investor-admin
- Create: http://localhost:4000/api/admin/investor-admin
- Update: http://localhost:4000/api/admin/investor-admin/{id}
- Transfer: http://localhost:4000/api/admin/investor-admin/transfer/{investorId}
- Statistics: http://localhost:4000/api/admin/investor-admin/statistics

Health Check:
- Health: http://localhost:4000/health
```

### **3. Pre-request Scripts**

**For Authentication (add to login request):**
```javascript
// Set environment variable after successful login
if (pm.response.code === 200) {
    const cookies = pm.response.headers.get('Set-Cookie');
    if (cookies) {
        const jwtMatch = cookies.match(/admin_jwt=([^;]+)/);
        if (jwtMatch) {
            pm.environment.set('admin_jwt', jwtMatch[1]);
        }
    }
}
```

**For Authenticated Requests:**
```javascript
// Automatically add JWT cookie
pm.request.headers.add({
    key: 'Cookie',
    value: `admin_jwt={{admin_jwt}}`
});
```

---

## 🔍 Testing Scenarios

### **Authentication Testing**
1. **Valid Login** - Should return success
2. **Invalid Credentials** - Should return 401
3. **Missing Fields** - Should return validation errors

### **Company Management Testing**
1. **Create Company** - Test with valid data
2. **Create Company** - Test with missing required fields
3. **Create Company** - Test with invalid phone/URL formats
4. **Get All Companies** - Should return company list
5. **Get Specific Company** - Test with valid and invalid IDs
6. **Update Company** - Test partial updates

### **Investor Form Testing**
1. **Submit Form** - Test with valid data
2. **Submit Form** - Test with missing required fields
3. **Submit Form** - Test with invalid formats
4. **Get Submissions** - Test admin access

### **Lead Management Testing**
1. **Create Lead** - Test with valid data
2. **Update Lead** - Test field updates
3. **Transfer Lead** - Test from public to admin
4. **Get Statistics** - Test analytics endpoint

---

## ⚠️ Common Error Responses

### **400 Bad Request - Validation Errors**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Error description"
    }
  ]
}
```

### **401 Unauthorized**
```json
{
  "success": false,
  "error": "Missing authentication cookie"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### **429 Too Many Requests**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later."
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🎯 Testing Checklist

### **Authentication**
- [ ] Admin login with valid credentials
- [ ] Admin login with invalid credentials
- [ ] Access protected endpoints without auth
- [ ] Logout functionality

### **Company Management**
- [ ] Create company with all fields
- [ ] Create company with only required fields
- [ ] Create company with invalid data
- [ ] Get all companies
- [ ] Get specific company
- [ ] Update company
- [ ] Handle validation errors

### **Investor Form**
- [ ] Submit form with valid data
- [ ] Submit form with missing fields
- [ ] Submit form with invalid formats
- [ ] Get submissions (admin only)

### **Lead Management**
- [ ] Create admin lead
- [ ] Update lead information
- [ ] Transfer public submission
- [ ] Get lead statistics

### **Error Handling**
- [ ] Validation errors (400)
- [ ] Authentication errors (401)
- [ ] Not found errors (404)
- [ ] Rate limiting (429)

---

## 🚀 Production Testing

### **Environment Variables for Production**
```
base_url: https://your-production-domain.com
admin_jwt: (leave empty)
```

### **Production Considerations**
1. **HTTPS Required** - All production requests must use HTTPS
2. **Rate Limiting** - Test rate limiting behavior
3. **CORS** - Verify CORS settings for your frontend domain
4. **Database** - Ensure production database is properly configured

---

This documentation provides everything needed to test all API endpoints using Postman. Each endpoint includes request/response examples, validation rules, and error scenarios for comprehensive testing.
