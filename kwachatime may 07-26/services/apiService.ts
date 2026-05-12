
import { User, Loan, MobileOperator, Location, TravelMode, OutgoingEmail, DocumentMetadata } from '../types';
import { backend } from '../backend';
import { generateLoanStatusEmail, generateBorrowerReport, generateLoanAgreement, generateLetterOfSale } from './geminiService';
import * as documentService from './documentService';
import * as storageService from './storageService';
import * as emailService from './emailService';

const LATENCY = 1000;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // Sync user data with backend
  async syncUser(user: User) {
    await wait(500);
    return backend.register(user);
  },

  // Get user data from backend
  async getUser(userId: string) {
    await wait(500);
    return backend.getUser(userId);
  },

  // Find user by email for manual admin login
  async getUserByEmail(email: string) {
    await wait(500);
    return backend.getUserByEmail(email);
  },

  // Submit a new loan request
  async submitLoanRequest(loan: Loan) {
    await wait(LATENCY * 1.5);
    return backend.submitLoan(loan);
  },

  // Silently update user location
  async updateLocation(userId: string, location: Location) {
    // Silent update, minimal latency
    return backend.updateLocation(userId, location);
  },

  // Update travel status to office
  async setTravelStatus(loanId: string, status: boolean, mode?: TravelMode, eta?: string) {
    await wait(500);
    return backend.setTravelStatus(loanId, status, mode, eta);
  },

  // Fix: Added missing updateLoanStatus method for admin dashboard
  async updateLoanStatus(loanId: string, status: Loan['status']) {
    await wait(LATENCY);
    const result = await backend.updateLoanStatus(loanId, status);
    
    if (result.status === 200 && result.loan) {
      // Trigger Background AI Email Generation for status changes
      const stats = await backend.getDashboardStats();
      const user = stats.users.find(u => u.id === result.loan!.userId);
      if (user) {
        generateLoanStatusEmail(user, result.loan, status).then(emailContent => {
          const email: OutgoingEmail = {
            id: `MAIL-${Date.now()}`,
            recipientEmail: user.email,
            recipientName: user.name,
            subject: emailContent.subject,
            body: emailContent.body,
            status: 'SENT',
            timestamp: new Date().toISOString(),
            loanId: result.loan!.id
          };
          backend.logEmail(email);
        });
      }
    }
    return result;
  },

  // Confirm loan disbursement and trigger payout
  async disburseLoan(loanId: string) {
    await wait(LATENCY * 2);
    const result = await backend.disburse(loanId);
    
    if (result.status === 200) {
      // Trigger Background AI Email Generation for Disbursement confirmation
      const stats = await backend.getDashboardStats();
      const loan = stats.loans.find(l => l.id === loanId);
      const user = stats.users.find(u => u.id === loan?.userId);
      if (user && loan) {
        generateLoanStatusEmail(user, loan, 'DISBURSED').then(emailContent => {
          const email: OutgoingEmail = {
            id: `MAIL-${Date.now()}`,
            recipientEmail: user.email,
            recipientName: user.name,
            subject: emailContent.subject,
            body: emailContent.body,
            status: 'SENT',
            timestamp: new Date().toISOString(),
            loanId: loan.id
          };
          backend.logEmail(email);
        });
      }
    }
    return result;
  },

  // Admin capital management
  async adjustCapital(amount: number, reason: string) {
    await wait(LATENCY);
    return backend.adjustVault(amount, reason);
  },

  // Run a system simulation for developer testing
  async simulateLoan(data: { name: string, principal: number, disbursedDate: string, dueDate: string }) {
    await wait(LATENCY);
    return backend.simulateLoan(data);
  },

  // Handle loan repayments
  async repayLoan(loanId: string, userId: string, totalAmount: number) {
    await wait(LATENCY);
    return backend.repay(loanId, userId, totalAmount);
  },

  // Mobile Money withdrawal logic
  async withdrawToMoMo(userId: string, amount: number, operator: MobileOperator) {
    await wait(2500); 
    return backend.withdrawToMoMo(userId, amount, operator);
  },

  // Mobile Money deposit logic
  async depositFromMoMo(userId: string, amount: number) {
    await wait(2000); 
    return backend.depositFromMoMo(userId, amount);
  },

  // Fetch management statistics
  async getAdminData() {
    await wait(800);
    return backend.getDashboardStats();
  },

  // Notification management
  async getNotifications(userId: string) {
    return backend.getNotifications(userId);
  },

  async markNotificationRead(id: string) {
    return backend.markNotificationRead(id);
  },

  subscribeToStats(callback: (stats: any) => void) {
    return backend.subscribeToStats(callback);
  },

  subscribeToUserLoans(userId: string, callback: (loans: any) => void) {
    return backend.subscribeToUserLoans(userId, callback);
  },

  // Process borrower submission (PDF generation, Email, POS)
  async processBorrowerSubmission(user: User, loan: Loan) {
    console.log(`[API Service] Processing submission for ${user.name}...`);
    const timestamp = new Date().toISOString();
    let docMetadata: DocumentMetadata[] = [];
    
    try {
      // 1. Generate Credential Report (KYC)
      try {
        console.log("[API Service] Generating KYC...");
        const kycHtml = await generateBorrowerReport(user);
        const kycBlob = await documentService.generatePDF(kycHtml || '', `KYC_${user.id}.pdf`);
        const kycUrl = await storageService.uploadDocument(kycBlob, `KYC_${user.id}.pdf`);
        docMetadata.push({ id: `DOC-KYC-${user.id}`, type: 'CREDENTIAL_REPORT', url: kycUrl, createdAt: timestamp, borrowerId: user.id });
      } catch (e) { console.error("KYC generation failed", e); }
      
      // 2. Generate Loan Agreement
      let agreementUrl = '';
      let posUrl = '';
      try {
        console.log("[API Service] Generating Agreement...");
        const agreementHtml = await generateLoanAgreement(user, loan);
        const agreementBlob = await documentService.generatePDF(agreementHtml || '', `AGREEMENT_${loan.id}.pdf`);
        agreementUrl = await storageService.uploadDocument(agreementBlob, `AGREEMENT_${loan.id}.pdf`);
        docMetadata.push({ id: `DOC-AGR-${loan.id}`, type: 'LOAN_AGREEMENT', url: agreementUrl, createdAt: timestamp, borrowerId: user.id, loanId: loan.id });
        
        // 4. Generate POS Print Format
        console.log("[API Service] Generating POS Format...");
        const posBlob = await documentService.generatePOSPrintFormat(agreementHtml || '');
        posUrl = await storageService.uploadDocument(posBlob, `POS_PRINT_${loan.id}.pdf`);
        docMetadata.push({ id: `DOC-POS-${loan.id}`, type: 'POS_PRINT', url: posUrl, createdAt: timestamp, borrowerId: user.id, loanId: loan.id });
      } catch (e) { console.error("Agreement/POS generation failed", e); }
      
      // 3. Generate Letter of Sale
      try {
        console.log("[API Service] Generating Sale Letter...");
        const saleLetterHtml = await generateLetterOfSale(user, loan);
        const saleLetterBlob = await documentService.generatePDF(saleLetterHtml || '', `SALE_LETTER_${loan.id}.pdf`);
        const saleLetterUrl = await storageService.uploadDocument(saleLetterBlob, `SALE_LETTER_${loan.id}.pdf`);
        docMetadata.push({ id: `DOC-SALE-${loan.id}`, type: 'LETTER_OF_SALE', url: saleLetterUrl, createdAt: timestamp, borrowerId: user.id, loanId: loan.id });
      } catch (e) { console.error("Sale letter generation failed", e); }

      // 5. Store Metadata in Backend
      if (docMetadata.length > 0) {
        await backend.saveDocuments(docMetadata);
      }

      // 6. Send Email Notification to Admins
      console.log("[API Service] Sending Admin Notification...");
      
      // Ensure we only send the raw base64 string without the prefix for the GAS backend
      const pdfBase64 = agreementUrl && agreementUrl.startsWith('data:application/pdf;base64,')
        ? agreementUrl.replace('data:application/pdf;base64,', '')
        : (agreementUrl && agreementUrl.includes('base64,') ? agreementUrl.split('base64,')[1] : '');

      await emailService.sendAdminNotification({
        borrowerName: user.name,
        borrowerId: user.id,
        documentType: docMetadata.length > 0 ? 'Loan Application Package' : 'Loan Application (DOC GEN FAILED)',
        timestamp,
        downloadLink: agreementUrl || '#',
        printReadyLink: posUrl || '#',
        pdfContentBase64: pdfBase64
      });

      console.log('[API Service] Submission processing complete.');
      return { success: true, documents: docMetadata };
    } catch (error) {
      console.error('[API Service] Submission processing failed', error);
      throw error;
    }
  }
};
