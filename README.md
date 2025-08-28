# Investor Form Backend

A production-ready Express.js + TypeScript backend for handling investor form submissions with advanced lead management capabilities. Built with Supabase (PostgreSQL), Prisma ORM, Nodemailer email notifications, Zod validation, and enterprise-grade security.

---

## 🚀 Features

### Core Functionality
- **Express.js with TypeScript** - Modern, type-safe backend development
- **Supabase PostgreSQL** via Prisma ORM - Scalable database with type-safe queries
- **Nodemailer (Gmail SMTP)** - Professional email notifications with Arabic RTL support
- **Zod validation** - Robust server-side input validation and sanitization
- **Company management system** - Full CRUD operations with auto-incrementing integer IDs
- **Enhanced investor form** - Company selection with integer-based company IDs
- **Advanced lead management** - Two-tier system for public submissions and admin leads

### Security & Performance
- **Rate limiting** - 5 requests/minute per IP with configurable limits
- **Input sanitization** - XSS protection for all user inputs
- **CORS protection** - Whitelisted origins with credentials support
- **JWT authentication** - Secure admin access with HttpOnly cookies
- **Helmet security headers** - Protection against common web vulnerabilities
- **Centralized error handling** - Consistent error responses across all endpoints

### Admin Features
- **Lead transfer system** - Move public submissions to admin management
- **Lead status tracking** - Track calling times, notes, and lead status
- **Investment analytics** - Statistics and reporting capabilities
- **Email tracking** - Monitor email delivery status
- **Secure admin dashboard** - Protected endpoints for lead management

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Gmail account for SMTP

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd investor-form-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma studio  # Optional: View/manage data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

---

## 📦 Project Structure

```
investor-form-backend/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── routes/
│   │   ├── investor.ts          # Public investor form API
│   │   ├── investorAdmin.ts     # Admin lead management API
│   │   ├── admin.ts             # Admin authentication API
│   │   └── company.ts           # Company management API
│   ├── middleware/
│   │   ├── validation.ts        # Zod validation schemas
│   │   ├── jwtAuth.ts           # JWT authentication middleware
│   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   └── errorHandler.ts      # Centralized error handling
│   ├── services/
│   │   ├── database.ts          # Prisma client instance
│   │   ├── email.ts             # Email notification service
│   │   └── validation.ts        # Environment variable validation
│   ├── types/
│   │   └── investor.ts          # TypeScript type definitions
│   └── utils/
│       └── constants.ts         # Project constants
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Database migration files
├── dist/                        # Compiled JavaScript output
├── logo_grab.png               # Company logo for emails
├── footer.png                  # Footer image for emails
└── package.json                # Project dependencies and scripts
```

---

## 📝 API Documentation

### Public Endpoints

#### POST `/api/investor-form`
Submit a new investor inquiry form.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "companyID": "1",
  "sharesQuantity": 100,
  "calculatedTotal": 5000,
  "city": "New York"
}
```

**Success Response (201):**
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

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["company"],
      "message": "Company is required"
    }
  ]
}
```

#### GET `/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

### Admin Endpoints (JWT Protected)

#### POST `/api/admin/login`
Authenticate as admin user.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Success Response:**
```json
{
  "success": true
}
```
*Note: JWT token is set as HttpOnly cookie*

#### POST `/api/admin/logout`
Logout and clear authentication cookie.

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/investor-form`
Retrieve all public investor submissions (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "companyID": "1",
      "sharesQuantity": 100,
      "calculatedTotal": 5000,
      "city": "New York",
      "submissionStatus": "received",
      "createdAt": "2024-06-01T12:00:00.000Z",
      "updatedAt": "2024-06-01T12:00:00.000Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false
    }
  ]
}
```

### Admin Lead Management Endpoints

#### GET `/api/admin/investor-admin`
Retrieve all admin leads.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "companyID": "1",
      "sharesQuantity": 100,
      "calculatedTotal": 5000,
      "investmentAmount": 5000,
      "city": "New York",
      "submissionStatus": "received",
      "notes": "VIP lead",
      "callingTimes": 2,
      "leadStatus": "contacted",
      "originalInvestorId": "original-uuid",
      "createdAt": "2024-06-01T12:00:00.000Z",
      "updatedAt": "2024-06-01T12:00:00.000Z",
      "emailSentToAdmin": true,
      "emailSentToInvestor": false
    }
  ]
}
```

#### POST `/api/admin/investor-admin`
Create a new admin lead.

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "phoneNumber": "+15551234567",
  "companyID": "2",
  "sharesQuantity": 200,
  "calculatedTotal": 10000,
  "investmentAmount": 10000,
  "city": "San Francisco",
  "notes": "High potential lead",
  "callingTimes": 0,
  "leadStatus": "new"
}
```

#### PUT `/api/admin/investor-admin/:id`
Update an existing admin lead.

**Request Body:**
```json
{
  "notes": "Called twice, interested in follow-up",
  "callingTimes": 2,
  "leadStatus": "contacted",
  "investmentAmount": 15000
}
```

#### POST `/api/admin/investor-admin/transfer/:investorId`
Transfer a public investor submission to admin lead management.

**Request Body:**
```json
{
  "notes": "Initial admin notes about this lead"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-admin-lead-uuid",
    "fullName": "John Doe",
    "companyID": "1",
    "notes": "Initial admin notes about this lead",
    "callingTimes": 0,
    "leadStatus": "new",
    "originalInvestorId": "original-investor-uuid"
  }
}
```

#### GET `/api/admin/investor-admin/statistics`
Get investment amount statistics.

**Response:**
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

### Company Management Endpoints (Admin Only)

#### GET `/api/admin/company`
Retrieve all companies (admin access required).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "companyID": 1,
      "name": "Tech Corp",
      "description": "Technology company specializing in software development",
      "phoneNumber": "+1234567890",
      "url": "https://techcorp.com",
      "createdAt": "2024-06-01T12:00:00.000Z",
      "updatedAt": "2024-06-01T12:00:00.000Z"
    }
  ]
}
```

#### GET `/api/admin/company/:companyID`
Retrieve a specific company by companyID (admin access required).

**Response:**
```json
{
  "success": true,
  "data": {
    "companyID": 1,
    "name": "Tech Corp",
    "description": "Technology company specializing in software development",
    "phoneNumber": "+1234567890",
    "url": "https://techcorp.com",
    "createdAt": "2024-06-01T12:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Company not found"
}
```

#### POST `/api/admin/company`
Create a new company (admin only - requires JWT authentication).

**Request Body:**
```json
{
  "name": "New Company",
  "description": "Company description",
  "phoneNumber": "+1234567890",
  "url": "https://newcompany.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "companyID": 5,
    "name": "New Company",
    "description": "Company description",
    "phoneNumber": "+1234567890",
    "url": "https://newcompany.com",
    "createdAt": "2024-06-01T12:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z"
  }
}
```

**Key Benefits:**
- **No manual ID generation** - System auto-assigns sequential integers (1, 2, 3, 4, 5...)
- **Better user experience** - Frontend just sends company info, backend handles IDs
- **No conflicts** - Each company gets a unique auto-incrementing ID
- **Cleaner data** - Integer IDs are easier to work with than UUIDs

#### PUT `/api/admin/company/:companyID`
Update an existing company (admin only).

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "phoneNumber": "+1987654321",
  "url": "https://updatedcompany.com"
}
```

#### DELETE `/api/admin/company/:companyID`
Delete a company (admin only).

**Success Response:**
```json
{
  "success": true,
  "data": {
    "companyID": 1,
    "name": "Deleted Company",
    "description": "Company description",
    "phoneNumber": "+1234567890",
    "url": "https://deletedcompany.com",
    "createdAt": "2024-06-01T12:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z"
  }
}
```

---

## 🗄️ Database Schema

### Company Model (Company Management)
```prisma
model Company {
  companyID    Int      @id @default(autoincrement())
  name         String
  description  String?
  phoneNumber  String?
  url          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relationships
  investors    Investor[]
  investorAdmins InvestorAdmin[]

  @@index([name])
  @@index([createdAt])
}
```

### Investor Model (Public Submissions)
```prisma
model Investor {
  id                    String   @id @default(uuid())
  fullName              String
  phoneNumber           String?
  companyID             Int?
  sharesQuantity        Int?
  calculatedTotal       Float?
  city                  String
  submissionStatus      String   @default("received")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  emailSentToAdmin      Boolean  @default(false)
  emailSentToInvestor   Boolean  @default(false)

  // Relationship
  company               Company? @relation(fields: [companyID], references: [companyID])

  @@index([sharesQuantity])
  @@index([createdAt])
  @@index([companyID])
}
```

### InvestorAdmin Model (Admin Leads)
```prisma
model InvestorAdmin {
  id                  String   @id @default(uuid())
  fullName            String
  phoneNumber         String?
  companyID           Int?
  sharesQuantity      Int?
  calculatedTotal     Float?
  investmentAmount    Float?
  city                String
  submissionStatus    String   @default("received")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  emailSentToAdmin    Boolean  @default(false)
  emailSentToInvestor Boolean  @default(false)
  notes               String?
  callingTimes        Int      @default(0)
  leadStatus          String   @default("new")
  originalInvestorId  String?

  // Relationship
  company             Company? @relation(fields: [companyID], references: [companyID])

  @@index([sharesQuantity])
  @@index([createdAt])
  @@index([leadStatus])
  @@index([companyID])
}
```

**Key Schema Features:**
- **Auto-incrementing company IDs** - No manual ID generation needed
- **Proper foreign key relationships** - Company → Investor/InvestorAdmin
- **Optional company association** - Investors can be created without company
- **Indexed fields** - Optimized queries for common operations

---

## 🔒 Security Features

### Authentication
- **JWT tokens** stored in HttpOnly cookies
- **Secure cookie attributes** (SameSite, Secure in production)
- **Bcrypt password hashing** for admin credentials
- **Token expiration** (24 hours)

### Input Protection
- **Zod validation** for all API inputs
- **XSS sanitization** for string inputs
- **Rate limiting** (5 requests/minute per IP)
- **CORS with whitelisted origins**

### Data Security
- **Prisma ORM** prevents SQL injection
- **Environment variable validation** at startup
- **Centralized error handling** (no sensitive data leakage)
- **Helmet security headers**

---

## 📧 Email System

### Features
- **Arabic RTL support** for email templates
- **Professional branding** with company logos
- **Admin notifications** for new submissions
- **Gmail SMTP integration**
- **Email delivery tracking**

### Email Template
- **Responsive design** with modern styling
- **Company branding** with logo and footer
- **Complete investor details** including company information
- **Arabic language support** for Middle Eastern markets

---

## 🧪 Testing

### Using curl
```bash
# Test public form submission
curl -X POST http://localhost:4000/api/investor-form \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "phoneNumber": "+15551234567",
    "companyID": "1",
    "sharesQuantity": 100,
    "calculatedTotal": 5000,
    "city": "San Francisco"
  }'

# Test admin login
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }' \
  -c cookies.txt

# Test protected endpoint
curl -X GET http://localhost:4000/api/admin/investor-admin \
  -b cookies.txt

# Test company endpoints
curl -X GET http://localhost:4000/api/admin/company

curl -X POST http://localhost:4000/api/admin/company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "description": "A test company",
    "phoneNumber": "+1234567890",
    "url": "https://testcompany.com"
  }' \
  -b cookies.txt
```

### Using Postman

#### Company API Testing in Postman

**1. Get All Companies (Admin Only)**
- **Method:** GET
- **URL:** `http://localhost:4000/api/admin/company`
- **Headers:** `Cookie: admin_jwt={your-jwt-token}`
- **Expected Response:** List of all companies

**2. Get Specific Company (Admin Only)**
- **Method:** GET
- **URL:** `http://localhost:4000/api/admin/company/{companyID}`
- **Headers:** `Cookie: admin_jwt={your-jwt-token}`
- **Expected Response:** Company details or 404 if not found

**3. Create Company (Admin Only)**
- **Method:** POST
- **URL:** `http://localhost:4000/api/admin/company`
- **Headers:** 
  - `Content-Type: application/json`
  - `Cookie: admin_jwt={your-jwt-token}`
- **Body:**
```json
{
  "name": "New Company",
  "description": "Company description",
  "phoneNumber": "+1234567890",
  "url": "https://newcompany.com"
}
```

**4. Update Company (Admin Only)**
- **Method:** PUT
- **URL:** `http://localhost:4000/api/admin/company/{companyID}`
- **Headers:** 
  - `Content-Type: application/json`
  - `Cookie: admin_jwt={your-jwt-token}`
- **Body:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description"
}
```

**5. Delete Company (Admin Only)**
- **Method:** DELETE
- **URL:** `http://localhost:4000/api/admin/company/{companyID}`
- **Headers:** `Cookie: admin_jwt={your-jwt-token}`
- **Expected Response:** Success message

#### Postman Setup Tips

1. **Create a Collection** for "Investor Form Backend"
2. **Set Environment Variables:**
   - `base_url`: `http://localhost:4000`
   - `admin_jwt`: Your JWT token after login
3. **Use Pre-request Scripts** to automatically set cookies
4. **Test Authentication First** with the admin login endpoint

### Error Scenarios
- **Missing required fields** → 400 with validation errors
- **Invalid company ID format** → 400 with "Company ID must be a positive integer" error
- **Invalid phone format** → 400 with phone format error
- **Rate limit exceeded** → 429 with retry information
- **Invalid credentials** → 401 with authentication error
- **Missing environment variables** → Server startup failure
- **Company not found** → 404 when referencing non-existent company ID

---

## ⚙️ Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Email Configuration
EMAIL_SERVICE_USER="your-email@gmail.com"
EMAIL_SERVICE_PASS="your-app-password"
COMPANY_ADMIN_EMAIL="admin@company.com"
COMPANY_NAME="Your Company Name"

# Frontend URLs (CORS)
FRONTEND_URL="https://yourdomain.com"
FRONTEND_2_URL="https://app.yourdomain.com"
FRONTEND_3_URL="https://app.yourseconddomain.com"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="bcrypt-hash-of-your-password"
```

### Optional Variables
```bash
# Server Configuration
PORT=4000
NODE_ENV=production
```

---

## 🚀 Deployment

### Supported Platforms
- **Railway** - Easy deployment with automatic environment variable management
- **Render** - Free tier available with PostgreSQL add-on
- **Heroku** - Traditional deployment with PostgreSQL
- **Vercel** - Serverless deployment option
- **DigitalOcean** - VPS deployment with full control

### Deployment Steps
1. **Set environment variables** in your deployment platform
2. **Configure database** (Supabase recommended)
3. **Set up email service** (Gmail SMTP)
4. **Deploy the application**
5. **Run database migrations** if needed
6. **Test all endpoints** after deployment

### Production Considerations
- **Use HTTPS** in production (required for secure cookies)
- **Set NODE_ENV=production** for optimized performance
- **Configure proper CORS origins** for your frontend domains
- **Monitor rate limiting** and adjust as needed
- **Set up logging** for production debugging

---

## 📊 Lead Management Workflow

### Public Submission Flow
1. **Investor submits form** → Data stored in `Investor` table
2. **Email notification sent** → Admin receives Arabic RTL email
3. **Form confirmation** → Success response to investor
4. **Admin reviews** → Lead appears in admin dashboard

### Admin Lead Management Flow
1. **Transfer public lead** → Move to `InvestorAdmin` table
2. **Add notes and status** → Track communication history
3. **Update calling times** → Monitor outreach efforts
4. **Set lead status** → Track progression (new, contacted, interested, etc.)
5. **Record investment amount** → Track actual investment values
6. **Generate reports** → Use statistics endpoint for insights

---

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio for data management

# Testing
npm test             # Run Jest tests
```

---

## 📚 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": [ /* validation errors */ ]
}
```

---

## 🎯 Use Cases

This backend is ideal for:
- **Investment companies** collecting investor inquiries
- **Real estate developers** managing investor leads
- **Startups** tracking investor interest and communication
- **Financial services** with lead qualification workflows
- **Companies in Middle Eastern markets** (Arabic email support)

---

## ✨ Recent Improvements

### Company Management System
- **✅ Auto-incrementing integer IDs** - No more manual ID generation or conflicts
- **✅ Simplified company creation** - Frontend just sends company info, backend handles IDs
- **✅ Proper database relationships** - Foreign key constraints between Company, Investor, and InvestorAdmin
- **✅ Better user experience** - Clean integer IDs (1, 2, 3, 4, 5...) instead of complex UUIDs

### Enhanced API Design
- **✅ Consistent company ID format** - All endpoints use integer company IDs
- **✅ Improved validation** - Better error messages for company ID validation
- **✅ Cleaner data structure** - Integer IDs are easier to work with and display

### Frontend Integration Benefits
- **✅ No ID conflicts** - Each company gets a unique sequential ID
- **✅ Easier form handling** - Simple integer selection instead of UUID management
- **✅ Better data display** - Clean company lists with sequential numbering

---

## 🔮 Future Enhancements

- **Investor email confirmations** - Direct confirmation emails to investors
- **Advanced analytics dashboard** - Real-time reporting and insights
- **Multi-tenant support** - Multiple companies on single instance
- **API rate limiting per user** - Individual user limits
- **Audit logging** - Complete activity tracking
- **Webhook integrations** - Third-party system integrations
- **SMS notifications** - Text message alerts for urgent leads

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

*Built with ❤️ using Express.js, TypeScript, Prisma, and Supabase* 