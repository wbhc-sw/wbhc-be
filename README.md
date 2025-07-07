# Investor Form Backend

A production-ready Express.js + TypeScript backend for handling investor form submissions, with Supabase (PostgreSQL), Prisma ORM, Nodemailer email notifications, Zod validation, and robust security.

---

## 🚀 Features
- Express.js with TypeScript
- Supabase PostgreSQL via Prisma ORM
- Nodemailer (Gmail SMTP) for email notifications
- Zod for server-side validation
- Rate limiting, input sanitization, CORS, and security best practices
- Structured error handling and logging
- Health check and graceful shutdown

---

## 🛠️ Setup & Installation

1. **Clone the repository**
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values.
4. **Set up the database:**
   ```sh
   npx prisma generate
   npx prisma db push
   npx prisma studio # (optional, to view/manage data)
   ```
5. **Run the development server:**
   ```sh
   npm run dev
   ```

---

## 📦 Project Structure
```
src/
├── index.ts
├── routes/
│   └── investor.ts
├── middleware/
│   ├── validation.ts
│   ├── rateLimiter.ts
│   └── errorHandler.ts
├── services/
│   ├── database.ts
│   ├── email.ts
│   └── validation.ts
├── types/
│   └── investor.ts
└── utils/
    └── constants.ts
```

---

## 📝 API Documentation

### POST `/api/investor-form`
- **Description:** Submit investor inquiry form
- **Request Body:**
  ```json
  {
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "investmentPackage": "Starter",
    "city": "New York"
  }
  ```
- **Success Response:**
  ```json
  {
    "success": true,
    "message": "Submission received",
    "data": {
      "id": "uuid",
      "createdAt": "2024-06-01T12:00:00.000Z"
    }
  }
  ```
- **Validation Error Response:**
  ```json
  {
    "success": false,
    "error": "Validation failed",
    "details": [
      { "path": ["fullName"], "message": "Full Name must be at least 2 characters" }
    ]
  }
  ```
- **Rate Limit Error:**
  ```json
  {
    "success": false,
    "error": "Too many requests, please try again later."
  }
  ```

### Health Check
- **GET `/health`**
  - Returns `{ status: 'ok', message: 'API is healthy' }`

---

## 🔒 Security
- CORS: Only allows requests from your frontend URL
- Rate limiting: 5 requests/minute per IP
- Input sanitization: Prevents XSS
- Helmet: Sets secure HTTP headers
- Centralized error handling

---

## 🧪 Testing Guide

### Using curl
```sh
curl -X POST http://localhost:4000/api/investor-form \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "phoneNumber": "+15551234567",
    "investmentPackage": "Starter",
    "city": "San Francisco"
  }'
```

### Using Postman
- Import the endpoint and use the sample request body above.

### Error Scenarios
- Missing fields: Returns 400 with validation errors
- Invalid phone: Returns 400 with phone format error
- Too many requests: Returns 429
- Missing env vars: Server will not start

---

## ⚙️ Deployment
- Deploy on Railway, Render, or similar
- Set all environment variables in your deployment dashboard
- Ensure CORS is set to your frontend domain

---

## 🧩 Environment Variables
See `.env.example` for all required variables.

---

## 📝 Notes
- Emails are sent to the company admin (no investor email field)
- Prisma manages DB schema and migrations
- All responses are JSON and compatible with Next.js frontend

---

## 📚 Further Improvements
- Add investor email field for direct confirmation
- Add admin dashboard for submissions
- Add authentication for admin endpoints

---

## 👨‍💻 Author & License
- MIT License 