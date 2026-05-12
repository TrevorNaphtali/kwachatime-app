import { Resend } from 'resend';

const ADMIN_EMAILS = [
  'pa@networkit.info',
  'naphtali@networkit.info',
  'ocmwila@networkit.info'
];

const googleAppsScriptUrl = (import.meta as any).env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyx5yXj1ErPp3qanJPYNLaV-nOk6NHaPF57Pq62U1tNF1OKhqGhCkA82BsqOsQs1_2l/exec';
const resendApiKey = (import.meta as any).env.VITE_RESEND_API_KEY;

export const sendAdminNotification = async (data: {
  borrowerName: string;
  borrowerId: string;
  documentType: string;
  timestamp: string;
  downloadLink: string;
  printReadyLink: string;
  pdfContentBase64?: string;
}) => {
  const subject = `[KwachaTime] New Document Submission: ${data.borrowerName}`;
  
  console.log(`[Email Service] Sending notification to: ${ADMIN_EMAILS.join(', ')}`);
  
  // Try Resend first as it's more robust for attachments/HTML
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #064e3b;">New Document Submission</h2>
        <p>A borrower has completed their submission formalities.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Borrower:</strong> ${data.borrowerName} (${data.borrowerId})</p>
        <p><strong>Document Type:</strong> ${data.documentType}</p>
        <p><strong>Timestamp:</strong> ${data.timestamp}</p>
        <div style="margin-top: 30px;">
          <a href="${data.downloadLink}" style="background-color: #064e3b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Download PDF</a>
          <a href="${data.printReadyLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Print Format (POS)</a>
        </div>
        <p style="font-size: 10px; color: #999; margin-top: 40px;">KwachaTime Micro-Lending Systems Ltd (2026)</p>
      </div>
    `;

    try {
      const { data: resendData, error } = await resend.emails.send({
        from: 'KwachaTime <onboarding@resend.dev>',
        to: ADMIN_EMAILS,
        subject,
        html,
      });

      if (error) {
        console.error('[Email Service] Resend Error:', error);
        throw error;
      }
      console.log('[Email Service] Email sent successfully via Resend.', resendData);
      return;
    } catch (error) {
      console.error('[Email Service] Resend failed, falling back to Google Apps Script', error);
    }
  }

  // Fallback to Google Apps Script
  if (googleAppsScriptUrl) {
    try {
      const response = await fetch(googleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerName: data.borrowerName,
          borrowerId: data.borrowerId,
          pdfContentBase64: data.pdfContentBase64,
          adminEmails: ADMIN_EMAILS
        })
      });
      const result = await response.json();
      console.log('[Email Service] Email sent successfully via Google Apps Script.', result);
    } catch (error) {
      console.error('[Email Service] Failed to send email via Google Apps Script', error);
    }
  } else {
    console.warn('[Email Service] No email provider configured (VITE_RESEND_API_KEY or VITE_GOOGLE_APPS_SCRIPT_URL).');
  }
};
