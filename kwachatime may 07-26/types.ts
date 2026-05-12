
export type MobileOperator = 'Airtel' | 'MTN' | 'Zamtel';
export type UserRole = 'BORROWER' | 'ADMIN' | 'DEVELOPER';
export type CollateralType = 'LAPTOP' | 'PHONE' | 'CAR' | 'APPLIANCE' | 'LAND' | 'OTHER' | 'NONE';
export type RepaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
export type TravelMode = 'walking' | 'cycling' | 'driving';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface StatusUpdate {
  status: Loan['status'];
  timestamp: string;
  message: string;
}

export interface OutgoingEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  status: 'SENT' | 'FAILED' | 'DRAFTING';
  timestamp: string;
  loanId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nrc: string;
  dob?: string;
  phone: string;
  address: string;
  employment?: string;
  incomeSource?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  operator: MobileOperator;
  role: UserRole;
  joinedAt: string;
  walletBalance?: number;
  trustScore?: number;
  currentLocation?: Location;
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  principal: number;
  purpose: string;
  tenure: string; // e.g., "14 Days"
  repaymentMethod: RepaymentMethod;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REJECTED' | 'REPAID' | 'AWAITING_COLLATERAL';
  createdAt: string;
  dueDate: string;
  disbursedAt?: string;
  borrowerPhoto?: string;
  borrowerNRC?: string;
  
  // Collateral Details
  collateralType: CollateralType;
  collateralDescription: string;
  collateralSerial?: string;
  collateralCondition?: string;
  collateralLocation?: string;
  collateralOwnershipProof?: string; // Descriptive
  
  // Legal
  hasAgreedToOwnership: boolean;
  hasAgreedToVerification: boolean;
  
  statusHistory?: StatusUpdate[];
  
  // Travel Tracking
  isTravelingToSite?: boolean;
  travelMode?: TravelMode;
  estimatedArrival?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  category: 'SECURITY' | 'FINANCE' | 'SYSTEM' | 'IDENTITY';
  details: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/** 
 * Added InterestBreakdown to fix error in utils/loanCalculator.ts 
 */
export interface InterestBreakdown {
  principal: number;
  baseInterest: number;
  dailyInterest: number;
  lateDelayFee: number;
  monthlyPenalty: number;
  totalDue: number;
  daysElapsed: number;
}

/** 
 * Added Transaction to fix error in App.tsx and backend.ts 
 */
export interface Transaction {
  id: string;
  userId: string;
  type: 'DISBURSEMENT' | 'REPAYMENT' | 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

/** 
 * Added AppNotification to fix error in backend.ts 
 */
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MESSAGE' | 'LOAN_UPDATE';
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
  loanId?: string; // Optional context
  read: boolean;
}

export interface DocumentMetadata {
  id: string;
  type: 'CREDENTIAL_REPORT' | 'LOAN_AGREEMENT' | 'LETTER_OF_SALE' | 'POS_PRINT';
  url: string; // Data URL or S3 URL
  createdAt: string;
  borrowerId: string;
  loanId?: string;
}

export interface DashboardStats {
  vaultBalance: number;
  loans: Loan[];
  users: User[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  outgoingEmails: OutgoingEmail[];
  documents?: DocumentMetadata[];
}
