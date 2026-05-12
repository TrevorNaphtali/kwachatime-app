# KwachaTime Micro-Lending - Standard Operating Procedure (SOP)

This document outlines the operational workflow for both Borrowers and Administrators using the KwachaTime platform.

---

## 1. Borrower Roadmap & SOP

### Phase 1: Onboarding & Registration
1.  **Access the App**: Open the KwachaTime PWA on your mobile device.
2.  **Google Login**: Click "Continue with Google" to create your secure account.
3.  **Complete Profile**: 
    *   Enter your full legal name, NRC number, and physical address.
    *   Provide your mobile money operator (Airtel, MTN, or Zamtel) and phone number.
    *   Add Next of Kin details (Required for security).

### Phase 2: Loan Application
1.  **Request Loan**: Click "Request Capital" on the dashboard.
2.  **Loan Details**: Enter the principal amount (ZMW), purpose of the loan, and preferred tenure.
3.  **Collateral Declaration**:
    *   Describe the item being pledged (e.g., Laptop, Phone, Car).
    *   Provide the Serial Number and condition.
4.  **Legal Agreement**: Review and digitally sign the Loan Agreement and Letter of Sale.
5.  **Submit**: Your application is now "PENDING" and sent to the Admin team.

### Phase 3: Verification & Disbursement
1.  **Physical Verification**: Visit the KwachaTime office at **38 Alick Nkhata Rd, Lusaka** with your collateral.
2.  **Admin Review**: An admin will inspect the collateral and verify your NRC.
3.  **Disbursement**: Once approved, funds are disbursed via Mobile Money or Cash. You will receive an automated email confirmation.

### Phase 4: Repayment
1.  **Monitor Due Date**: Check your dashboard for the countdown to your repayment date.
2.  **Make Payment**: Repay via Mobile Money or at the office.
3.  **Loan Closure**: Once paid, your status updates to "REPAID," and your Trust Score increases for future higher limits.

---

## 2. Admin Roadmap & SOP

### Phase 1: Accessing the Vault
1.  **Admin Login**: Click "Admin Access" at the bottom of the login screen.
2.  **Credentials**: Enter an authorized admin email and the vault password: `kwachatime`.
3.  **Dashboard Overview**: Monitor total capital, active loans, and pending requests.

### Phase 2: Processing Applications
1.  **Review Pending**: Click on a "PENDING" loan in the list.
2.  **Check Documents**: Review the AI-generated KYC report and signed agreements (sent to your admin email).
3.  **Update Status**:
    *   **Approve**: If the borrower is credible.
    *   **Awaiting Collateral**: If you are waiting for them to bring the item to the office.
    *   **Reject**: If the application does not meet criteria.

### Phase 3: Disbursement & Payouts
1.  **Verify Item**: When the borrower arrives, verify the collateral serial number matches the app.
2.  **Disburse**: Click the "Disburse" button. This logs the transaction and triggers the automated disbursement email to the borrower.
3.  **POS Printing**: Use the "Print POS" option to generate a thermal-printer-ready receipt for the borrower.

### Phase 4: Portfolio Management
1.  **Monitor Defaults**: Use the "Overdue" filter to identify late payments.
2.  **Vault Management**: Use "Adjust Capital" to add or remove funds from the lending pool.
3.  **Audit Logs**: Review the system logs for all financial and security actions.

---

## 3. System Maintenance (Developer SOP)
1.  **Environment Variables**: Ensure `GEMINI_API_KEY` and `GOOGLE_APPS_SCRIPT_URL` are active in AI Studio settings.
2.  **Firebase Rules**: Do not modify `firestore.rules` without running a security audit.
3.  **Updates**: To push changes to Netlify, export the code from AI Studio and deploy the new build.

**KwachaTime Support Contact:** +260977752428 | ocmwila@networkit.info
