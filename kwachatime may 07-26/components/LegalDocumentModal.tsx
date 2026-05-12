
import React, { useState, useEffect } from 'react';
import { generateLoanAgreement, generateLetterOfSale, generateBorrowerReport } from '../services/geminiService';
import { generatePDF } from '../services/documentService';
import { User, Loan } from '../types';

interface LegalDocumentModalProps {
  user: User;
  loan?: Loan;
  type: 'AGREEMENT' | 'LETTER_OF_SALE' | 'CREDENTIAL_REPORT';
  onClose: () => void;
}

const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({ user, loan, type, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadDoc = async () => {
      setIsLoading(true);
      let doc = '';
      if (type === 'CREDENTIAL_REPORT') {
        doc = await generateBorrowerReport(user);
      } else if (loan) {
        doc = type === 'AGREEMENT' 
          ? await generateLoanAgreement(user, loan)
          : await generateLetterOfSale(user, loan);
      }
      setContent(doc || '');
      setIsLoading(false);
    };
    loadDoc();
  }, [user, loan, type]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!content) return;
    setIsDownloading(true);
    try {
      const filename = type === 'AGREEMENT' ? `Loan_Agreement_${loan?.id}.pdf` : type === 'LETTER_OF_SALE' ? `Letter_of_Sale_${loan?.id}.pdf` : `Borrower_Report_${user.id}.pdf`;
      const blob = await generatePDF(content, filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-xl animate-fadeIn no-print">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col transition-all">
        
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">
              {type === 'AGREEMENT' ? 'Loan Agreement' : type === 'LETTER_OF_SALE' ? 'Letter of Sale' : 'Identity Credentials'}
            </h3>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
              {type === 'CREDENTIAL_REPORT' ? `System Record ID: ${user.id}` : `Registry Ref: ${loan?.id}/${type.slice(0,3)}`}
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleDownload}
              disabled={isLoading || isDownloading}
              className="px-6 py-4 bg-emerald-100 text-emerald-800 rounded-2xl font-black uppercase text-[10px] shadow-sm hover:bg-emerald-200 transition-all flex items-center gap-3"
            >
              <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i> {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              onClick={handlePrint}
              disabled={isLoading}
              className="px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-emerald-950 transition-all flex items-center gap-3"
            >
              <i className="fas fa-print"></i> Print
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white border rounded-2xl text-gray-400 hover:text-red-500 transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-12 bg-white flex justify-center">
          <div className="w-full max-w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-gray-100 shadow-sm relative document-view">
             {isLoading ? (
               <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase text-emerald-600 animate-pulse">Drafting Legal Document...</p>
               </div>
             ) : (
               <div className="legal-content-styled">
                 <div dangerouslySetInnerHTML={{ __html: content }} />
               </div>
             )}
             
             {/* Watermark */}
             {!isLoading && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none">
                 <span className="text-[120px] font-black uppercase">Internal Record</span>
               </div>
             )}
          </div>
        </div>
      </div>

      <style>{`
        .legal-content-styled {
          font-family: 'Times New Roman', serif;
          line-height: 1.5;
          color: #1a202c;
          font-size: 13px;
        }
        .legal-content-styled h1, .legal-content-styled h2 {
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          border-bottom: 2px solid #064e3b;
          margin-bottom: 0.75rem;
          margin-top: 1.5rem;
          color: #064e3b;
        }
        @media print {
          body * { visibility: hidden; }
          .document-view, .document-view * { visibility: visible; }
          .document-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: auto !important;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LegalDocumentModal;
