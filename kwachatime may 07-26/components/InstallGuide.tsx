
import React from 'react';

interface InstallGuideProps {
  onClose: () => void;
}

const InstallGuide: React.FC<InstallGuideProps> = ({ onClose }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-slideUp">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Install Kwacha Ledger</h3>
            <button onClick={onClose} className="text-gray-300 hover:text-red-500 text-2xl">&times;</button>
          </div>

          <div className="space-y-6">
            <div className="text-center p-6 bg-emerald-50 rounded-3xl">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-mobile-screen-button text-2xl"></i>
              </div>
              <p className="text-xs font-bold text-emerald-900 uppercase">No App Store Needed</p>
              <p className="text-[10px] text-emerald-700 mt-1 uppercase font-black opacity-60">Install directly from your browser</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Instructions for {isIOS ? 'iPhone (Safari)' : 'Android (Chrome)'}</h4>
              
              {isIOS ? (
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                    <p className="text-[11px] text-gray-600">Tap the <i className="fas fa-share-from-square text-blue-500"></i> <strong>Share</strong> button at the bottom of Safari.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                    <p className="text-[11px] text-gray-600">Scroll down and tap <strong>'Add to Home Screen'</strong> <i className="fas fa-plus-square"></i>.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                    <p className="text-[11px] text-gray-600">Tap the <i className="fas fa-ellipsis-vertical"></i> <strong>Menu</strong> icon in the top right of Chrome.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                    <p className="text-[11px] text-gray-600">Select <strong>'Install App'</strong> or <strong>'Add to Home Screen'</strong>.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <p className="text-[9px] font-black text-orange-900 uppercase mb-1">Management Note:</p>
              <p className="text-[9px] text-orange-800 leading-tight">
                An offline APK version for bulk installation via Bluetooth/Flash is available for physical office distribution.
              </p>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-5 bg-emerald-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-950 transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
