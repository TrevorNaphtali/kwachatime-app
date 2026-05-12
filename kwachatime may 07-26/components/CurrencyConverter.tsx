
import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/loanCalculator';

const BASE_RATES: Record<string, number> = {
  USD: 26.45,
  GBP: 33.12,
  EUR: 28.54,
  ZAR: 1.42
};

const CurrencyConverter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [zmwAmount, setZmwAmount] = useState<string>('100');
  const [direction, setDirection] = useState<'TO_ZMW' | 'FROM_ZMW'>('FROM_ZMW');
  const [activeCurrency, setActiveCurrency] = useState('USD');

  const conversion = useMemo(() => {
    const val = parseFloat(zmwAmount) || 0;
    const rate = BASE_RATES[activeCurrency];
    if (direction === 'FROM_ZMW') {
      return (val / rate).toFixed(2);
    } else {
      return (val * rate).toFixed(2);
    }
  }, [zmwAmount, activeCurrency, direction]);

  const currencySymbols: Record<string, string> = {
    USD: '$', GBP: '£', EUR: '€', ZAR: 'R'
  };

  return (
    <>
      {/* Floating Flutter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-10 z-[2000] w-16 h-16 bg-emerald-600 text-white rounded-full shadow-[0_0_30px_rgba(5,150,105,0.5)] hover:shadow-[0_0_50px_rgba(5,150,105,0.8)] transition-all active:scale-90 group flex items-center justify-center border-4 border-white/20 backdrop-blur-sm"
      >
        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-20"></div>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-coins'} text-2xl transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}></i>
        
        {/* Hover Label */}
        <span className="absolute right-20 bg-emerald-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-emerald-800">
          Kwacha Oracle
        </span>
      </button>

      {/* Converter Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[1999] flex items-end justify-end p-6 md:p-12 pointer-events-none animate-fadeIn">
          <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-white/50 p-8 pointer-events-auto transform transition-all animate-slideUp">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Market Pulse</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Bank of Zambia Mid-Rates</p>
              </div>
              <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-chart-line text-sm"></i>
              </div>
            </div>

            <div className="space-y-6">
              {/* Currency Selector Tabs */}
              <div className="flex bg-gray-100/50 p-1.5 rounded-2xl">
                {Object.keys(BASE_RATES).map(curr => (
                  <button
                    key={curr}
                    onClick={() => setActiveCurrency(curr)}
                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeCurrency === curr ? 'bg-emerald-800 text-white shadow-xl scale-105' : 'text-gray-400'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="relative group">
                <div className="absolute top-4 left-5 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                  {direction === 'FROM_ZMW' ? 'ZMW (Kwacha)' : `${activeCurrency} Amount`}
                </div>
                <input
                  type="number"
                  value={zmwAmount}
                  onChange={(e) => setZmwAmount(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-50 p-6 pt-10 rounded-3xl text-3xl font-black text-emerald-950 outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-3 relative z-10">
                <button 
                  onClick={() => setDirection(direction === 'FROM_ZMW' ? 'TO_ZMW' : 'FROM_ZMW')}
                  className="w-12 h-12 bg-emerald-950 text-white rounded-full border-4 border-white shadow-xl hover:rotate-180 transition-transform active:scale-90"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>

              {/* Result Area */}
              <div className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-emerald-100 text-6xl font-black opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                  {currencySymbols[activeCurrency]}
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Equivalent Value</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-950">
                    {direction === 'FROM_ZMW' ? currencySymbols[activeCurrency] : 'K'}
                    {conversion}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 uppercase">
                    {direction === 'FROM_ZMW' ? activeCurrency : 'ZMW'}
                  </span>
                </div>
              </div>

              {/* AI Market Note */}
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4">
                 <div className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0"><i className="fas fa-robot text-xs"></i></div>
                 <p className="text-[10px] font-medium text-orange-950 leading-tight">
                    <span className="font-black uppercase block mb-1">AI Analyst Pulse</span>
                    ZMW remains stable against USD this week. Local mining sector improvements suggest positive momentum for Kwacha.
                 </p>
              </div>
            </div>

            <p className="mt-8 text-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">Data refreshed every 15 minutes</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CurrencyConverter;
