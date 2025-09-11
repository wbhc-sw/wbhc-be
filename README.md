# Investor Form Backend with Enterprise Role-Based Authentication

A **production-ready Express.js + TypeScript backend** for handling investor form submissions with **advanced lead management capabilities** and **enterprise-grade role-based authentication**. Built with Supabase (PostgreSQL), Prisma ORM, Nodemailer email notifications, Zod validation, and comprehensive security features.

---

## 🚀 Features

### 🔐 **Advanced Authentication System**
- **6-Level Role-Based Access Control** - Fine-grained permissions for different user types
- **Multi-Tenant Architecture** - Company-scoped access control for enterprise use
- **JWT with HttpOnly Cookies** - Secure token management with automatic cookie handling
- **Legacy Admin Support** - Backward compatibility with existing admin systems
- **User Management Dashboard** - Complete CRUD operations for user administration
- **Company-Specific Access** - Users can be restricted to specific company data

### 👥 **User Roles & Permissions**

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | System-wide | Full CRUD access to all data, user management |
| **COMPANY_ADMIN** | Company-specific | Full CRUD access within assigned company |
| **SUPER_VIEWER** | System-wide | Read-only access to all data |
| **COMPANY_VIEWER** | Company-specific | Read-only access to assigned company data |
| **SUPER_CREATOR** | System-wide | Create data anywhere, read access (no edit/delete) |
| **COMPANY_CREATOR** | Company-specific | Create data in assigned company, read access |

### 🏢 **Core Business Functionality**
- **Express.js with TypeScript** - Modern, type-safe backend development
- **Supabase PostgreSQL** via Prisma ORM - Scalable database with type-safe queries
- **Nodemailer (Gmail SMTP)** - Professional email notifications with Arabic RTL support
- **Company Management System** - Full CRUD operations with auto-incrementing integer IDs
- **Enhanced Investor Form** - Company selection with integer-based company IDs
- **Advanced Lead Management** - Two-tier system for public submissions and admin leads
- **Lead Transfer System** - Move public submissions to admin management
- **Investment Analytics** - Statistics and reporting capabilities

### 🛡️ **Security & Performance**
- **Role-Based Access Control** - Granular permissions for all API endpoints
- **Company-Scoped Security** - Users can only access their assigned company data
- **Input Sanitization** - XSS protection for all user inputs with Zod validation
- **Rate Limiting** - 5 requests/minute per IP with configurable limits
- **CORS Protection** - Whitelisted origins with credentials support
- **Helmet Security Headers** - Protection against common web vulnerabilities
- **Centralized Error Handling** - Consistent error responses across all endpoints

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
   # Edit .env with your configuration (see Environment Variables section)
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:studio  # Optional: View/manage data
   ```

5. **Create your first admin user**
   ```bash
   npm run create-admin admin admin@yourcompany.com yourpassword
   ```

6. **Run the development server**
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
│   │   ├── user.ts              # User management & authentication API
│   │   ├── admin.ts             # Legacy admin authentication API
│   │   ├── investor.ts          # Public investor form API
│   │   ├── investorAdmin.ts     # Admin lead management API
│   │   └── company.ts           # Company management API
│   ├── middleware/
│   │   ├── roleAuth.ts          # Role-based authentication middleware
│   │   ├── jwtAuth.ts           # JWT authentication middleware (legacy)
│   │   ├── validation.ts        # Zod validation schemas
│   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   └── errorHandler.ts      # Centralized error handling
│   ├── services/
│   │   ├── database.ts          # Prisma client instance
│   │   ├── email.ts             # Email notification service
│   │   └── validation.ts        # Environment variable validation
│   ├── types/
│   │   └── investor.ts          # TypeScript type definitions & user roles
│   ├── scripts/
│   │   └── createAdmin.ts       # Admin user creation script
│   └── utils/
│       └── constants.ts         # Project constants
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Database migration files
├── dist/                        # Compiled JavaScript output
├── POSTMAN_API_DOCUMENTATION.md # Complete API testing guide
├── AUTHENTICATION_GUIDE.md     # Authentication system documentation
└── package.json                # Project dependencies and scripts
```

---

## 🔐 Authentication System

### **Login Endpoints**

#### **POST `/api/admin/users/login`** (Recommended)
Modern database user authentication with role-based access.

**Request:**
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Response:**
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

#### **POST `/api/admin/login`** (Legacy)
Backward compatibility with existing admin systems.

### **User Management Endpoints** (SUPER_ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | Get all users |
| `GET` | `/api/admin/users/:id` | Get user by ID |
| `POST` | `/api/admin/users` | Create new user |
| `PUT` | `/api/admin/users/:id` | Update user |
| `DELETE` | `/api/admin/users/:id` | Delete user |
| `GET` | `/api/admin/users/me/profile` | Get current user profile |

### **Creating Users**

```bash
# Create different role users
npm run create-admin super_admin admin@company.com password123

# Or via API (SUPER_ADMIN required)
POST /api/admin/users
{
  "username": "company_admin_1",
  "email": "company1@test.com",
  "password": "password123",
  "role": "company_admin",
  "companyId": 1
}
```

---

## 📝 API Documentation

### **Public Endpoints**

#### **POST `/api/investor-form`**
Submit a new investor inquiry form (no authentication required).

**Request Body:**
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

**Success Response (201):**
```json
{
  "success": true,
  "message": "Submission received",
  "data": {
    "id": "uuid-string",
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

### **Protected Endpoints** (Role-based access)

#### **GET `/api/investor-form`**
Retrieve investor submissions.
- **SUPER roles**: See all submissions
- **COMPANY roles**: See only their company's submissions

#### **GET `/api/admin/company`**
Retrieve companies.
- **SUPER roles**: See all companies
- **COMPANY roles**: See only their assigned company

#### **POST `/api/admin/company`**
Create new company.
- **Allowed roles**: `SUPER_ADMIN`, `SUPER_CREATOR`
- **Restricted**: Company-specific roles cannot create companies

#### **GET `/api/admin/investor-admin`**
Retrieve admin leads with filtering.
- **SUPER roles**: See all leads, can filter by any company
- **COMPANY roles**: See only their company's leads

**Query Parameters:**
```
?search=John          # Search in fullName and phoneNumber
?status=contacted     # Filter by leadStatus
?city=Riyadh         # Filter by city
?companyID=1         # Filter by company (SUPER roles only)
```

#### **POST `/api/admin/investor-admin`**
Create new admin lead.
- **COMPANY roles**: Can only create leads for their assigned company
- **SUPER roles**: Can create leads for any company

**Company-Specific Enforcement:**
```json
// company_creator user (companyId: 1) tries to create for company 2
{
  "companyID": 2,  // ❌ This will be rejected
  "fullName": "TEST"
}

// Response:
{
  "success": false,
  "error": "Access denied. You can only create leads for company ID 1, but you tried to create for company ID 2"
}
```

---

## 🗄️ Database Schema

### **User Model** (New)
```prisma
model User {
  id          String   @id @default(uuid())
  username    String   @unique
  email       String   @unique
  passwordHash String
  role        String   @default("company_viewer")
  companyId   Int?     // For company-specific roles
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  company     Company? @relation(fields: [companyId], references: [companyID])
  
  @@index([role])
  @@index([companyId])
  @@index([username])
  @@index([email])
}
```

### **Company Model**
```prisma
model Company {
  name           String
  description    String?
  phoneNumber    String?
  url            String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  companyID      Int             @id @default(autoincrement())
  
  // Relationships
  investors      Investor[]
  investorAdmins InvestorAdmin[]
  users          User[]          // Users assigned to this company

  @@index([name])
  @@index([createdAt])
}
```

### **Investor Model** (Public Submissions)
```prisma
model Investor {
  id                  String   @id @default(uuid())
  fullName            String
  phoneNumber         String?
  city                String
  source              String   @default("received")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  emailSentToAdmin    Boolean  @default(false)
  emailSentToInvestor Boolean  @default(false)
  calculatedTotal     Float?
  sharesQuantity      Int?
  companyID           Int?
  transferred         Boolean  @default(false)
  company             Company? @relation(fields: [companyID], references: [companyID])

  @@index([sharesQuantity])
  @@index([createdAt])
  @@index([companyID])
}
```

### **InvestorAdmin Model** (Admin Leads)
```prisma
model InvestorAdmin {
  id                  Int      @id @unique @default(autoincrement())
  fullName            String
  phoneNumber         String?
  city                String
  source              String   @default("received")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  emailSentToAdmin    Boolean  @default(false)
  emailSentToInvestor Boolean  @default(false)
  notes               String?
  callingTimes        Int?     @default(0)
  leadStatus          String   @default("new")
  originalInvestorId  String?
  investmentAmount    Float?
  calculatedTotal     Float?
  sharesQuantity      Int?
  companyID           Int?
  company             Company? @relation(fields: [companyID], references: [companyID])

  @@index([sharesQuantity])
  @@index([createdAt])
  @@index([leadStatus])
  @@index([companyID])
}
```

---

## ⚙️ Environment Variables

### **Required Variables**
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
FRONTEND_2_URL="https://app.yourdomain.com"    # Optional
FRONTEND_3_URL="https://app.yourseconddomain.com"  # Optional

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-256-bits"
```

### **Optional Variables (Legacy Support)**
```bash
# Legacy Admin (for backward compatibility)
ADMIN_USERNAME="admin"                    # Will be deprecated
ADMIN_PASSWORD_HASH="bcrypt-hash"         # Will be deprecated

# Server Configuration
PORT=4000
NODE_ENV=production
```

---

## 🧪 Testing & Development

### **Development Scripts**
```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio for data management

# User Management
npm run create-admin     # Create admin user script
```

### **Role-Based Testing Scenarios**

#### **1. Super Admin Testing**
```bash
# Create super admin
npm run create-admin super_admin admin@test.com password123

# Test full access (should work)
GET /api/admin/users                    ✅
GET /api/admin/company                  ✅
POST /api/admin/company                 ✅
DELETE /api/admin/company/1             ✅
```

#### **2. Company Admin Testing**
```bash
# Create company admin for company 1
POST /api/admin/users
{
  "username": "company_admin",
  "role": "company_admin",
  "companyId": 1
}

# Test company-specific access
GET /api/admin/users                    ❌ Access denied
GET /api/admin/company                  ✅ Only sees company 1
POST /api/admin/investor-admin          ✅ Can create leads for company 1
POST /api/admin/investor-admin (companyID: 2)  ❌ Access denied
```

#### **3. Viewer Testing**
```bash
# Create company viewer
POST /api/admin/users
{
  "role": "company_viewer",
  "companyId": 1
}

# Test read-only access
GET /api/admin/company                  ✅ Only sees company 1
POST /api/admin/company                 ❌ Access denied
PUT /api/admin/company/1                ❌ Access denied
DELETE /api/admin/company/1             ❌ Access denied
```

#### **4. Creator Testing**
```bash
# Create company creator
POST /api/admin/users
{
  "role": "company_creator",
  "companyId": 1
}

# Test create-only access
GET /api/admin/investor-admin           ✅ Can read
POST /api/admin/investor-admin          ✅ Can create for company 1
PUT /api/admin/investor-admin/123       ❌ Access denied
POST /api/admin/company                 ❌ Cannot create companies
```

### **Using curl for Testing**
```bash
# Login and save cookie
curl -X POST http://localhost:4000/api/admin/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' \
  -c cookies.txt

# Test protected endpoint
curl -X GET http://localhost:4000/api/admin/users/me/profile \
  -b cookies.txt

# Create company admin user
curl -X POST http://localhost:4000/api/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "company_admin_1",
    "email": "company1@test.com",
    "password": "password123",
    "role": "company_admin",
    "companyId": 1
  }'
```

---

## 🔒 Security Features

### **Authentication Security**
- **JWT tokens** stored in HttpOnly cookies (cannot be accessed by JavaScript)
- **Secure cookie attributes** (SameSite=lax, Secure in production)
- **Bcrypt password hashing** with 12 rounds for all user passwords
- **Token expiration** (24 hours) with automatic renewal
- **Role-based access control** with granular permissions

### **Authorization Security**
- **Company-scoped access** - Users can only access their assigned company data
- **Role-based endpoint protection** - Each API endpoint checks user permissions
- **Data filtering** - Queries automatically filter based on user's company assignment
- **Cross-company access prevention** - Company users cannot access other companies' data

### **Input Protection**
- **Zod validation** for all API inputs with detailed error messages
- **XSS sanitization** for all string inputs using xss library
- **Rate limiting** (5 requests/minute per IP) with configurable limits
- **CORS with whitelisted origins** supporting multiple frontend domains

### **Data Security**
- **Prisma ORM** prevents SQL injection attacks
- **Environment variable validation** at startup
- **Centralized error handling** prevents sensitive data leakage
- **Helmet security headers** for additional protection

---

## 📧 Email System

### **Features**
- **Arabic RTL support** for email templates
- **Professional branding** with company logos and footers
- **Admin notifications** for new investor submissions
- **Gmail SMTP integration** with app passwords
- **Email delivery tracking** for monitoring

### **Email Template Features**
- **Responsive design** with modern styling
- **Company branding** with customizable logo and footer
- **Complete investor details** including company information
- **Arabic language support** for Middle Eastern markets
- **Professional formatting** with proper RTL text direction

---

## 🚀 Deployment

### **Supported Platforms**
- **Railway** - Easy deployment with automatic environment variable management
- **Render** - Free tier available with PostgreSQL add-on
- **Heroku** - Traditional deployment with PostgreSQL
- **Vercel** - Serverless deployment option
- **DigitalOcean** - VPS deployment with full control

### **Deployment Steps**
1. **Set environment variables** in your deployment platform
2. **Configure Supabase database** with connection string
3. **Set up Gmail SMTP** with app password
4. **Deploy the application** with build command
5. **Run database migrations** using Prisma
6. **Create first admin user** using the script
7. **Test all endpoints** after deployment

### **Production Considerations**
- **Use HTTPS** in production (required for secure cookies)
- **Set NODE_ENV=production** for optimized performance
- **Configure proper CORS origins** for your frontend domains
- **Monitor rate limiting** and adjust limits based on usage
- **Set up logging** for production debugging and monitoring
- **Regular database backups** for data protection

---

## 🎯 Use Cases

This backend is ideal for:

### **Investment Management**
- **Investment companies** collecting and managing investor inquiries
- **Real estate developers** tracking investor leads and communications
- **Startups** managing investor relations and lead qualification
- **Financial services** with complex lead management workflows

### **Multi-Tenant Applications**
- **Enterprise SaaS** requiring company-specific data isolation
- **White-label solutions** for multiple client companies
- **Franchise operations** with location-specific access control
- **Consulting firms** managing multiple client accounts

### **Regional Markets**
- **Middle Eastern markets** with Arabic language support
- **International companies** with multi-language requirements
- **Companies with RTL language** needs in email communications

---

## ✨ Recent Major Improvements

### **🔐 Enterprise Authentication System**
- **✅ 6-Level Role-Based Access Control** - Fine-grained permissions for different user types
- **✅ Multi-Tenant Architecture** - Company-scoped access control for enterprise use
- **✅ User Management Dashboard** - Complete CRUD operations for user administration
- **✅ Backward Compatibility** - Legacy admin system still supported

### **🏢 Enhanced Company Management**
- **✅ Auto-incrementing Company IDs** - No manual ID generation or conflicts
- **✅ Company-User Relationships** - Users can be assigned to specific companies
- **✅ Company-Scoped Data Access** - Automatic filtering based on user's company assignment
- **✅ Role-Based Company Operations** - Different permissions for company management

### **🛡️ Advanced Security Features**
- **✅ Company-Specific Access Control** - Users can only access their assigned company data
- **✅ Role-Based API Protection** - Every endpoint checks user permissions
- **✅ Cross-Company Access Prevention** - Strict data isolation between companies
- **✅ Enhanced Input Validation** - Comprehensive validation with detailed error messages

### **📊 Improved Lead Management**
- **✅ Role-Based Lead Access** - Different users see different lead data
- **✅ Company-Scoped Statistics** - Analytics filtered by user's company
- **✅ Enhanced Lead Creation** - Automatic company assignment based on user role
- **✅ Lead Transfer Controls** - Role-based restrictions on lead transfers

---

## 🔮 Future Enhancements

### **Authentication & Authorization**
- **Multi-factor authentication (MFA)** - Additional security layer
- **Single Sign-On (SSO)** - Integration with enterprise identity providers
- **API key authentication** - For third-party integrations
- **Session management** - Advanced session control and monitoring

### **Advanced Features**
- **Audit logging** - Complete activity tracking for compliance
- **Webhook integrations** - Real-time notifications to third-party systems
- **Advanced analytics dashboard** - Real-time reporting with role-based insights
- **Bulk operations** - Mass data import/export with role restrictions

### **Enterprise Features**
- **Custom role definitions** - Allow admins to define custom roles
- **Department-level access** - Sub-company organizational units
- **Data retention policies** - Automated data lifecycle management
- **Compliance reporting** - GDPR, CCPA, and other regulatory compliance

---

## 📚 Documentation

- **[Complete API Documentation](POSTMAN_API_DOCUMENTATION.md)** - Comprehensive Postman testing guide
- **[Authentication Guide](AUTHENTICATION_GUIDE.md)** - Detailed authentication system documentation
- **[Role-Based Access Control Guide](#-authentication-system)** - Understanding user roles and permissions

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript typing
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

---

## 📞 Support

For support and questions:
- **Create an issue** in the repository with detailed description
- **Check the documentation** for common solutions and examples
- **Review the Postman collection** for API testing examples
- **Contact the development team** for enterprise support

---

*Built with ❤️ using Express.js, TypeScript, Prisma, Supabase, and enterprise-grade security practices* 