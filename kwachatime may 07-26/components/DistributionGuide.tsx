
import React from 'react';

interface DistributionGuideProps {
  onClose: () => void;
}

const DistributionGuide: React.FC<DistributionGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-emerald-950/98 backdrop-blur-2xl animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-slideUp">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Free Path</span>
                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Zero-Cost APK Roadmap</h3>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No Credit Card or Payment Required</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all text-2xl">&times;</button>
          </div>

          <div className="space-y-6">
            {/* Security Warning Section */}
            <div className="p-5 bg-red-50 border-2 border-red-100 rounded-3xl mb-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-user-shield text-red-600"></i>
                <h4 className="text-[10px] font-black uppercase text-red-900">Critical: Source Code Security</h4>
              </div>
              <p className="text-[9px] text-red-800 font-medium leading-tight">
                <strong>DO NOT enable "Source Maps" or "Source Code visibility"</strong> in your hosting settings. 
                Your code contains the Management emails. Keeping the code private prevents users from seeing how you verify admins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 relative">
                <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Easiest</div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black mb-4">1</div>
                <h4 className="text-[11px] font-black uppercase text-blue-900 mb-2">Netlify Drop (FREE)</h4>
                <p className="text-[10px] text-blue-800/70 leading-relaxed">
                  Go to <strong>app.netlify.com/drop</strong>. Drag your folder there. It gives you a free link <strong>without asking for a credit card.</strong>
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-8 h-8 bg-emerald-800 text-white rounded-xl flex items-center justify-center font-black mb-4">2</div>
                <h4 className="text-[11px] font-black uppercase text-emerald-900 mb-2">PWABuilder (FREE)</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Go to <strong>PWABuilder.com</strong>. Paste your Netlify link. It will build your Android Package (.apk) for free.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-8 h-8 bg-emerald-800 text-white rounded-xl flex items-center justify-center font-black mb-4">3</div>
                <h4 className="text-[11px] font-black uppercase text-emerald-900 mb-2">Download Package</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Download the zip. Look for <strong>android-arm64-v8a-signed.apk</strong>. This is your professional app file.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 bg-orange-50 rounded-3xl border-2 border-orange-200">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black mb-4">4</div>
                <h4 className="text-[11px] font-black uppercase text-emerald-900 mb-2">WhatsApp Transfer</h4>
                <p className="text-[10px] text-orange-800 leading-relaxed">
                  Send that <strong>.apk</strong> to your phone. Open it and click "Install Anyway" to bypass the Play Store warning.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 py-6 bg-emerald-800 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-950 transition-all"
          >
            I Understand, Build Securely
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributionGuide;
