
import React, { useState } from 'react';
import { CollateralType, RepaymentMethod } from '../types';

interface LoanFormProps {
  onSubmit: (loanData: any) => void;
  isLoading: boolean;
}

const COLLATERAL_DATA: Record<CollateralType, { label: string; icon: string }> = {
  PHONE: { label: 'Phone', icon: 'fa-mobile-screen' },
  LAPTOP: { label: 'PC / Laptop', icon: 'fa-laptop' },
  CAR: { label: 'Vehicle', icon: 'fa-car' },
  APPLIANCE: { label: 'Appliance', icon: 'fa-plug' },
  LAND: { label: 'Land/Property', icon: 'fa-map-location' },
  OTHER: { label: 'Other', icon: 'fa-ellipsis' },
  NONE: { label: 'None', icon: 'fa-ban' }
};

const LoanForm: React.FC<LoanFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    principal: '',
    purpose: '',
    tenure: '14 Days',
    repaymentMethod: 'CASH' as RepaymentMethod,
    collateralType: 'NONE' as CollateralType,
    collateralDescription: '',
    collateralSerial: '',
    collateralCondition: '',
    collateralLocation: '',
    borrowerNRC: '',
    borrowerPhoto: '',
    hasAgreedToOwnership: false,
    hasAgreedToVerification: false
  });

  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo is too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, borrowerPhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.principal || !formData.purpose)) {
      setError("Please enter loan amount and purpose.");
      return;
    }
    if (step === 2 && (formData.collateralType === 'NONE' || !formData.collateralDescription)) {
      setError("Please provide complete collateral details.");
      return;
    }
    if (step === 3 && (!formData.borrowerNRC || !formData.borrowerPhoto)) {
      setError("Identity Verification Requirements: Please provide NRC and a Photo.");
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log("[LoanForm] Attempting submission...", formData);
    
    if (!formData.hasAgreedToOwnership || !formData.hasAgreedToVerification) {
      console.warn("[LoanForm] Legal agreement missing");
      setError("Legal: You must agree to both declarations to continue.");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-slate-700 w-full max-w-2xl mx-auto animate-fadeIn transition-colors">
      
      {/* Information Box - White Text */}
      <div className="mb-8 md:mb-10 p-4 md:p-6 bg-orange-600 dark:bg-orange-700 border-2 border-orange-400 dark:border-orange-500 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col sm:flex-row gap-4 md:gap-5 shadow-lg shadow-orange-500/20">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
          <i className="fas fa-handshake-angle text-lg md:text-xl"></i>
        </div>
        <div>
          <p className="text-[10px] md:text-[11px] font-black uppercase text-white mb-1 tracking-widest">Physical Payout Alert</p>
          <p className="text-[11px] md:text-[12px] text-white font-bold leading-relaxed">
            KwachaTime strictly operates via physical hand-to-hand disbursements at our office. No digital transfers for first-time loans.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 gap-4">
        <h2 className="text-xl md:text-2xl font-black text-emerald-950 dark:text-white uppercase tracking-tighter">Application Form</h2>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 w-6 md:w-8 rounded-full ${step >= i ? 'bg-emerald-600' : 'bg-gray-100 dark:bg-slate-700'}`}></div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Section 1: Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Amount (ZMW)</label>
                <input 
                  type="number" 
                  value={formData.principal}
                  onChange={e => setFormData({...formData, principal: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Repayment Period</label>
                <select 
                  value={formData.tenure}
                  onChange={e => setFormData({...formData, tenure: e.target.value})}
                  className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold appearance-none text-white"
                >
                  <option>14 Days</option>
                  <option>30 Days</option>
                  <option>60 Days</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Loan Purpose</label>
              <textarea 
                value={formData.purpose}
                onChange={e => setFormData({...formData, purpose: e.target.value})}
                placeholder="Reason for borrowing..."
                className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold h-32 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Section 2: Collateral Registry</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {(Object.keys(COLLATERAL_DATA) as CollateralType[]).filter(k => k !== 'NONE').map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({...formData, collateralType: key})}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${formData.collateralType === key ? 'bg-emerald-800 border-emerald-800 text-white shadow-xl scale-105' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-700 text-gray-400'}`}
                >
                  <i className={`fas ${COLLATERAL_DATA[key].icon} text-xl mb-2`}></i>
                  <span className="text-[9px] font-black uppercase text-center">{COLLATERAL_DATA[key].label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Description (e.g. iPhone 15 Pro)"
                value={formData.collateralDescription}
                onChange={e => setFormData({...formData, collateralDescription: e.target.value})}
                className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-xs text-white placeholder:text-gray-500"
              />
              <input 
                placeholder="Serial Number / IMEI"
                value={formData.collateralSerial}
                onChange={e => setFormData({...formData, collateralSerial: e.target.value})}
                className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-xs text-white placeholder:text-gray-500"
              />
              <input 
                placeholder="Condition of Item"
                value={formData.collateralCondition}
                onChange={e => setFormData({...formData, collateralCondition: e.target.value})}
                className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-xs text-white placeholder:text-gray-500"
              />
              <input 
                placeholder="Location of Item"
                value={formData.collateralLocation}
                onChange={e => setFormData({...formData, collateralLocation: e.target.value})}
                className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-xs text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Section 3: Identity Verification</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Legal NRC Number</label>
                <input 
                  value={formData.borrowerNRC}
                  onChange={e => setFormData({...formData, borrowerNRC: e.target.value})}
                  placeholder="000000/00/0"
                  className="w-full bg-slate-900 p-5 rounded-3xl outline-none border-2 border-transparent focus:border-emerald-500 font-bold text-white placeholder:text-gray-500 tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Verification Photo</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden" 
                    id="borrower-photo"
                  />
                  <label 
                    htmlFor="borrower-photo"
                    className={`w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.borrowerPhoto ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-900 hover:border-emerald-500'}`}
                  >
                    {formData.borrowerPhoto ? (
                      <div className="relative w-full h-full p-2">
                         <img src={formData.borrowerPhoto} className="w-full h-full object-cover rounded-[1.5rem]" />
                         <div className="absolute inset-0 bg-black/40 rounded-[1.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-black text-[9px] uppercase">Replace Photo</span>
                         </div>
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-camera text-2xl text-slate-600 mb-3"></i>
                        <span className="text-[9px] font-black text-slate-500 uppercase">Selfie or Borrower Photo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Section 4: Repayment Settings</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase ml-4 text-gray-500">Repayment Plan</label>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({...formData, repaymentMethod: m as RepaymentMethod})}
                    className={`p-4 rounded-2xl border-2 text-[9px] font-black uppercase ${formData.repaymentMethod === m ? 'bg-emerald-800 border-emerald-800 text-white' : 'bg-gray-50 dark:bg-slate-900 border-transparent text-gray-400'}`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Section 5: Legal Finalization</h3>
            <div className="space-y-4">
              <div 
                onClick={() => setFormData({...formData, hasAgreedToOwnership: !formData.hasAgreedToOwnership})}
                className={`flex items-start gap-4 p-5 rounded-3xl cursor-pointer transition-all border-2 ${formData.hasAgreedToOwnership ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-gray-50 dark:bg-slate-900 border-transparent'}`}
              >
                <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${formData.hasAgreedToOwnership ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-transparent'}`}>
                  <i className="fas fa-check text-xs"></i>
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                  I confirm that I am the sole owner of the collateral described and I pledge it as security for this loan request.
                </span>
              </div>

              <div 
                onClick={() => setFormData({...formData, hasAgreedToVerification: !formData.hasAgreedToVerification})}
                className={`flex items-start gap-4 p-5 rounded-3xl cursor-pointer transition-all border-2 ${formData.hasAgreedToVerification ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-gray-50 dark:bg-slate-900 border-transparent'}`}
              >
                <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${formData.hasAgreedToVerification ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-transparent'}`}>
                  <i className="fas fa-check text-xs"></i>
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                  I authorize KwachaTime to verify the ownership of my collateral and perform a credit check for the permanent registry.
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-6">
            <p className="text-red-600 dark:text-red-400 text-[10px] font-black text-center uppercase animate-shake">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {step > 1 && (
            <button 
              type="button"
              onClick={prevStep}
              className="flex-1 py-4 md:py-6 bg-gray-100 dark:bg-slate-700 text-gray-400 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest transition-all"
            >
              Back
            </button>
          )}
          
          {step < 5 ? (
            <button 
              type="button"
              onClick={nextStep}
              className="flex-[2] py-4 md:py-6 bg-emerald-800 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition-all"
            >
              Next
            </button>
          ) : (
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-4 md:py-6 bg-emerald-800 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Apply Now"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
