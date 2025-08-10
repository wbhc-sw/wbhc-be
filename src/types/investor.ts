export interface InvestorForm {
  fullName: string;
  phoneNumber?: string;
  sharesQuantity?: number;
  calculatedTotal?: number;
  city: string;
}

export interface InvestorAdmin {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  sharesQuantity?: number | null;
  calculatedTotal?: number | null;
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
