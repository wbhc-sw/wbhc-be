export interface Company {
  companyID: number;
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  url?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestorForm {
  fullName: string;
  phoneNumber: string;
  companyID?: number;
  sharesQuantity: number;
  calculatedTotal: number;
  city: string;
}

export interface Investor {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  sharesQuantity: number | null;
  calculatedTotal: number | null;
  city: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  emailSentToAdmin: boolean;
  emailSentToInvestor: boolean;
  companyID: number | null;
  transferred: boolean;
  company?: Company | null;
}

export interface InvestorAdmin {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  sharesQuantity: number | null;
  calculatedTotal: number | null;
  investmentAmount: number | null;
  city: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  emailSentToAdmin: boolean;
  emailSentToInvestor: boolean;
  notes: string | null;
  callingTimes: number | null;
  leadStatus: string;
  originalInvestorId: string | null;
  companyID: number | null;
  company?: Company | null;
}

// New authentication types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',           // Full access to everything
  COMPANY_ADMIN = 'company_admin',       // Full access to their company
  SUPER_VIEWER = 'super_viewer',         // Read-only access to everything
  COMPANY_VIEWER = 'company_viewer',     // Read-only access to their company
  SUPER_CREATOR = 'super_creator',       // Create data anywhere (no edit/delete)
  COMPANY_CREATOR = 'company_creator'    // Create data in their company (no edit/delete)
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  companyId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: Company | null;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  companyId?: number;
  iat?: number;
  exp?: number;
}

// User creation/update interfaces
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  companyId?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  companyId?: number;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    companyId?: number;
  };
}
