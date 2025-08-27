# Company Management API - Frontend Documentation

## 🏢 Company Management System

This document provides comprehensive frontend integration details for the Company Management API endpoints. The system uses auto-incrementing integer IDs for companies, eliminating the need for manual ID generation.

---

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/company` | Get all companies | ✅ JWT |
| `GET` | `/api/admin/company/:companyID` | Get specific company | ✅ JWT |
| `POST` | `/api/admin/company` | Create new company | ✅ JWT |
| `PUT` | `/api/admin/company/:companyID` | Update company | ✅ JWT |

---

## 🔐 Authentication

All company endpoints require JWT authentication. The JWT token must be included in the request cookies.

**Login First:**
```javascript
// 1. Login to get JWT token
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    username: 'admin',
    password: 'your-password'
  })
});

// 2. JWT token is automatically set as HttpOnly cookie
// 3. Use credentials: 'include' for all subsequent requests
```

---

## 📡 API Endpoints Details

### 1. Get All Companies

**Endpoint:** `GET /api/admin/company`

**Authentication:** Required (JWT)

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  // JWT token automatically included via cookies
}
```

**Request Body:** None

**Response - Success (200):**
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
      "name": "Tala Line",
      "description": "Technology investment company",
      "phoneNumber": "+966501234567",
      "url": "https://talaline.sa",
      "createdAt": "2025-08-27T10:57:53.167Z",
      "updatedAt": "2025-08-27T10:57:53.167Z"
    }
  ]
}
```

**Response - Error (401):**
```json
{
  "success": false,
  "error": "Missing authentication cookie"
}
```

---

### 2. Get Specific Company

**Endpoint:** `GET /api/admin/company/:companyID`

**Authentication:** Required (JWT)

**URL Parameters:**
- `companyID` (integer): The ID of the company to retrieve

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  // JWT token automatically included via cookies
}
```

**Request Body:** None

**Response - Success (200):**
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

**Response - Error (400):**
```json
{
  "success": false,
  "error": "Invalid company ID"
}
```

**Response - Error (404):**
```json
{
  "success": false,
  "error": "Company not found"
}
```

---

### 3. Create New Company

**Endpoint:** `POST /api/admin/company`

**Authentication:** Required (JWT)

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  // JWT token automatically included via cookies
}
```

**Request Body:**
```json
{
  "name": "New Company Name",
  "description": "Company description (optional)",
  "phoneNumber": "+1234567890 (optional)",
  "url": "https://company.com (optional)"
}
```

**Field Validation Rules:**
- **`name`**: Required, minimum 1 character
- **`description`**: Optional, string
- **`phoneNumber`**: Optional, must match format: numbers, +, -, spaces, parentheses
- **`url`**: Optional, must be valid URL format or empty string

**Response - Success (201):**
```json
{
  "success": true,
  "data": {
    "companyID": 5,
    "name": "New Company Name",
    "description": "Company description",
    "phoneNumber": "+1234567890",
    "url": "https://company.com",
    "createdAt": "2025-08-27T11:42:55.643Z",
    "updatedAt": "2025-08-27T11:42:55.643Z"
  }
}
```

**Response - Error (400) - Validation Failed:**
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
    },
    {
      "path": ["url"],
      "message": "Invalid URL format"
    }
  ]
}
```

**Response - Error (401):**
```json
{
  "success": false,
  "error": "Missing authentication cookie"
}
```

---

### 4. Update Company

**Endpoint:** `PUT /api/admin/company/:companyID`

**Authentication:** Required (JWT)

**URL Parameters:**
- `companyID` (integer): The ID of the company to update

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  // JWT token automatically included via cookies
}
```

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "phoneNumber": "+1987654321",
  "url": "https://updatedcompany.com"
}
```

**Field Validation Rules:**
- All fields are optional - only send fields you want to update
- **`name`**: If provided, minimum 1 character
- **`phoneNumber`**: If provided, must match format: numbers, +, -, spaces, parentheses
- **`url`**: If provided, must be valid URL format or empty string

**Response - Success (200):**
```json
{
  "success": true,
  "data": {
    "companyID": 1,
    "name": "Updated Company Name",
    "description": "Updated description",
    "phoneNumber": "+1987654321",
    "url": "https://updatedcompany.com",
    "createdAt": "2025-08-27T10:57:22.882Z",
    "updatedAt": "2025-08-27T11:45:30.123Z"
  }
}
```

**Response - Error (400) - Validation Failed:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["phoneNumber"],
      "message": "Invalid phone number format"
    }
  ]
}
```

**Response - Error (404):**
```json
{
  "success": false,
  "error": "Company not found"
}
```

---

## 🔍 Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
   - User not logged in
   - JWT token expired
   - Invalid JWT token

2. **Validation Errors (400)**
   - Missing required fields
   - Invalid phone number format
   - Invalid URL format

3. **Not Found Errors (404)**
   - Company ID doesn't exist
   - Invalid company ID format

4. **Server Errors (500)**
   - Database connection issues
   - Internal server errors

---

## 📱 Phone Number Format Validation

The API accepts phone numbers in the following format:
- **Valid:** `+1234567890`, `+1-234-567-8900`, `+1 (234) 567-8900`
- **Invalid:** `abc123`, `123.456.7890`, `123/456-7890`

---

## 🎨 UI/UX Recommendations

1. **Company ID Display**
   - Show company IDs prominently (they're sequential and user-friendly)
   - Use company IDs in URLs and breadcrumbs

2. **Form Design**
   - Make company name field prominent
   - Use proper input types (tel for phone, url for website)
   - Show validation errors inline

3. **Company List**
   - Sort by company ID (newest first)
   - Show company ID, name, and description prominently
   - Use cards or table layout for better organization

4. **Success Feedback**
   - Show success messages after operations
   - Highlight newly created/updated companies
   - Provide clear next steps

---

## 🔧 Testing

### Test Data Examples

```javascript
// Valid company data
const validCompany = {
  name: "Test Company",
  description: "A test company for development",
  phoneNumber: "+966501234567",
  url: "https://testcompany.com"
};

// Invalid company data (for testing validation)
const invalidCompany = {
  name: "", // Missing required field
  phoneNumber: "abc123", // Invalid format
  url: "not-a-url" // Invalid URL
};
```

### API Testing Checklist

- [ ] Create company with all fields
- [ ] Create company with only required fields
- [ ] Update company with partial data
- [ ] Handle validation errors gracefully
- [ ] Test authentication requirements
- [ ] Verify auto-generated company IDs
- [ ] Test phone number format validation
- [ ] Test URL format validation

---

This documentation provides everything needed for frontend developers to integrate with the Company Management API. The system is designed to be user-friendly with auto-generated IDs and comprehensive validation.
