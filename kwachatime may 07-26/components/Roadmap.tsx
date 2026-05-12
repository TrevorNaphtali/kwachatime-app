
import React from 'react';

const STEPS = [
  { id: 1, title: 'Digital Request', desc: 'Submit request & collateral details via portal.', icon: 'fa-file-signature' },
  { id: 2, title: 'AI Verification', desc: 'Face & NRC auto-verification.', icon: 'fa-robot' },
  { id: 3, title: 'Office Arrival', desc: 'Follow the map to our site for physical appraisal.', icon: 'fa-map-location-dot' },
  { id: 4, title: 'Manual Handover', desc: 'Get your cash or MoMo transfer instantly.', icon: 'fa-handshake' },
];

const Roadmap: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-gray-100 dark:border-slate-700 transition-colors">
      <h3 className="text-[10px] md:text-xs font-black text-gray-400 mb-8 md:mb-10 flex items-center gap-2">
        <i className="fas fa-map-signs text-emerald-600"></i> Capital Roadmap
      </h3>
      <div className="space-y-8 md:space-y-10">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="relative flex gap-4 md:gap-6 group">
            {idx !== STEPS.length - 1 && (
              <div className="absolute top-10 left-5 w-[2px] h-full bg-gray-100 dark:bg-slate-700 -z-10 group-hover:bg-emerald-200 transition-colors"></div>
            )}
            <div className="w-10 h-10 rounded-xl md:rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-emerald-800 group-hover:text-white transition-all duration-500">
              <i className={`fas ${step.icon} text-sm`}></i>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-black text-emerald-950 dark:text-white mb-1">{step.title}</h4>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-medium leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
