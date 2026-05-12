
import React, { useState } from 'react';
import { generatePDF } from '../services/documentService';
import { DocumentMetadata, User } from '../types';

interface OperationalManualProps {
  onClose: () => void;
  documents: DocumentMetadata[];
  currentUser: User | null;
}

const OperationalManual: React.FC<OperationalManualProps> = ({ onClose, documents, currentUser }) => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentMetadata) => {
    setIsDownloading(doc.id);
    try {
      // If it's a data URL, we can just download it
      if (doc.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = `${doc.type}_${doc.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback for external URLs
        window.open(doc.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed', error);
    } finally {
      setIsDownloading(null);
    }
  };

  const getDocIcon = (type: DocumentMetadata['type']) => {
    switch (type) {
      case 'LOAN_AGREEMENT': return 'fa-file-contract';
      case 'LETTER_OF_SALE': return 'fa-file-signature';
      case 'CREDENTIAL_REPORT': return 'fa-id-card';
      case 'POS_PRINT': return 'fa-receipt';
      default: return 'fa-file-pdf';
    }
  };

  const getDocLabel = (type: DocumentMetadata['type']) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-2 md:p-4 bg-slate-900/95 backdrop-blur-xl animate-fadeIn no-print">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[95vh] md:h-[92vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col transition-all border border-gray-100 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 md:p-8 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-800 text-white rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-lg">
              <i className="fas fa-folder-open"></i>
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-emerald-950 dark:text-white uppercase tracking-tighter">Document Repository</h3>
              <p className="text-[8px] md:text-[10px] font-black uppercase text-emerald-600 tracking-widest">Legal Ledger & Agreements</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl md:rounded-2xl text-gray-400 hover:text-red-500 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-12 bg-gray-100 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="bg-emerald-800 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2">Secure Document Access</h4>
                <p className="text-[11px] opacity-80 leading-relaxed max-w-md">
                  Access your AI-generated legal contracts, letters of sale, and identity reports. These documents are legally binding and stored in our encrypted vault.
                </p>
              </div>
              <i className="fas fa-shield-halved absolute right-[-20px] bottom-[-20px] text-9xl opacity-10 rotate-12"></i>
            </div>

            {documents.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-file-circle-exclamation text-gray-300 text-2xl"></i>
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Documents Found</p>
                <p className="text-[10px] text-gray-500 mt-2">Submit a loan application to generate legal documents.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl flex items-center gap-5"
                  >
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      <i className={`fas ${getDocIcon(doc.type)}`}></i>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h5 className="text-[11px] font-black uppercase truncate">{getDocLabel(doc.type)}</h5>
                      <p className="text-[9px] text-gray-400 font-bold mt-1">ID: {doc.id.split('-').pop()}</p>
                      <p className="text-[8px] text-emerald-600 font-black mt-0.5">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading === doc.id}
                      className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:bg-emerald-800 hover:text-white rounded-xl flex items-center justify-center transition-all"
                    >
                      <i className={`fas ${isDownloading === doc.id ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-8 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-[2.5rem]">
              <div className="flex gap-4">
                <i className="fas fa-circle-info text-orange-500 mt-1"></i>
                <div>
                  <p className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase mb-1">Legal Notice</p>
                  <p className="text-[10px] text-orange-700 dark:text-orange-500/80 leading-relaxed">
                    These documents are generated based on the information provided during your application. Any tampering with these files is a violation of the KwachaTime Terms of Service and may lead to legal action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 text-center">
          <p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.5em]">
            KwachaTime Micro-Lending Systems • Secure Document Vault
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationalManual;
