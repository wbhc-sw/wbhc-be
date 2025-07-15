export interface InvestorForm {
  fullName: string;
  phoneNumber?: string;
  investmentPackage: string;
  city: string;
}

export interface InvestorAdmin {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  investmentPackage: string;
  city: string;
  submissionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  emailSentToAdmin: boolean;
  emailSentToInvestor: boolean;
  notes?: string | null;
  callingTimes: number;
  leadStatus: string;
  originalInvestorId?: string | null;
  investmentAmount?: number | null;
  originalInvestor?: InvestorForm | null;
}
