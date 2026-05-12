
import React, { useState } from 'react';
import { UserRole } from '../types';

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

interface OnboardingTourProps {
  role: UserRole;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ role, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const borrowerSteps: TourStep[] = [
    {
      title: "Welcome to KwachaTime",
      description: "Your premier partner for fast, secure micro-loans in Zambia. Let's show you how to secure your capital.",
      icon: "fa-hand-holding-dollar"
    },
    {
      title: "Your Digital Ledger",
      description: "Monitor your available wallet balance. You can fund your ledger at any branch or withdraw via MoMo instantly.",
      icon: "fa-wallet"
    },
    {
      title: "Fast Applications",
      description: "Choose your collateral, provide details, and snap a secure identity selfie to submit your request in seconds.",
      icon: "fa-bolt"
    },
    {
      title: "Navigation & PTA",
      description: "Once approved, use the map to find our office. Choose your transport mode to get an Estimated Arrival time.",
      icon: "fa-map-location-dot"
    }
  ];

  const adminSteps: TourStep[] = [
    {
      title: "Management Console",
      description: "Welcome to the Ops Terminal. Here you monitor vault liquidity, portfolio risk, and capital adjustments.",
      icon: "fa-terminal"
    },
    {
      title: "Approval Workflow",
      description: "Review incoming loan requests. Verify identity photos and collateral value before confirming physical payouts.",
      icon: "fa-hourglass-half"
    },
    {
      title: "Live GPS Tracking",
      description: "Monitor approved borrowers traveling to your site in real-time. Coordinate staff for incoming arrivals.",
      icon: "fa-satellite-dish"
    },
    {
      title: "Legal Ledger",
      description: "Access the master registry to manage user records and export professional PDF legal reports for audit.",
      icon: "fa-file-contract"
    }
  ];

  const steps = role === 'ADMIN' || role === 'DEVELOPER' ? adminSteps : borrowerSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800 transition-all">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-200 dark:bg-slate-800'}`}
                />
              ))}
            </div>
            <button 
              onClick={onComplete}
              className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors tracking-widest"
            >
              Skip
            </button>
          </div>

          <div className="text-center space-y-6 animate-slideUp" key={currentStep}>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <i className={`fas ${steps[currentStep].icon} text-3xl`}></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {steps[currentStep].title}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          <div className="mt-12">
            <button 
              onClick={handleNext}
              className="w-full py-6 bg-emerald-800 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-950 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {currentStep === steps.length - 1 ? 'Start Banking' : 'Continue'}
              <i className={`fas ${currentStep === steps.length - 1 ? 'fa-check' : 'fa-arrow-right'} text-sm`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
