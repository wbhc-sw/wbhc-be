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
  submissionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  emailSentToAdmin: boolean;
  emailSentToInvestor: boolean;
  companyID: number | null;
  transferred: boolean;
  company?: Company | null;
}

export interface InvestorAdmin {
  id: number; // Changed from string to number
  fullName: string;
  phoneNumber: string | null;
  sharesQuantity: number | null;
  calculatedTotal: number | null;
  // investmentAmount: number | null;
  city: string;
  submissionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  emailSentToAdmin: boolean;
  emailSentToInvestor: boolean;
  notes: string | null;
  callingTimes: number;
  leadStatus: string;
  originalInvestorId: string | null; // Keep as string since it references Investor.id
  companyID: number | null;
  company?: Company | null;
}
