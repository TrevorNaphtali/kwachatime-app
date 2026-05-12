
import React, { useState, useEffect } from 'react';
import { getOfficeDirections } from '../services/geminiService';
import { Loan, TravelMode } from '../types';
import { apiService } from '../services/apiService';

interface OfficeLocatorProps {
  activeLoan?: Loan;
}

const OfficeLocator: React.FC<OfficeLocatorProps> = ({ activeLoan }) => {
  const [mode, setMode] = useState<TravelMode>('driving');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [directions, setDirections] = useState<{text: string, links: any[]} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTraveling, setIsTraveling] = useState(activeLoan?.isTravelingToSite || false);

  useEffect(() => {
    if (activeLoan) {
      setIsTraveling(activeLoan.isTravelingToSite || false);
    }
  }, [activeLoan]);

  const handleStartJourney = async () => {
    if (!activeLoan) return;
    setIsLoading(true);
    try {
      await apiService.setTravelStatus(activeLoan.id, true, mode);
      setIsTraveling(true);
    } catch (error) {
      console.error("Failed to start journey", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndJourney = async () => {
    if (!activeLoan) return;
    setIsLoading(true);
    try {
      await apiService.setTravelStatus(activeLoan.id, false);
      setIsTraveling(false);
    } catch (error) {
      console.error("Failed to end journey", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = () => {
    setLocationError(null);
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        console.error("Location access denied", err);
        setLocationError("Location access denied. Please enable GPS and allow permission in your browser settings.");
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchDirections = async (newMode?: 'walking' | 'cycling' | 'driving') => {
    if (!location) {
      requestLocation();
      return;
    }
    const targetMode = newMode || mode;
    setIsLoading(true);
    try {
      const result = await getOfficeDirections(location.lat, location.lng, targetMode);
      setDirections(result);
    } catch (error) {
      console.error("Failed to fetch directions", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-emerald-950 dark:bg-slate-900 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group border border-emerald-900 dark:border-slate-800 transition-colors">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-800/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-[10px] md:text-xs font-black uppercase text-emerald-500 mb-6 md:mb-8 tracking-[0.2em] flex items-center gap-2">
          <i className="fas fa-location-dot"></i> Official Branch
        </h3>

        {locationError && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 animate-shake">
            <p className="text-[9px] md:text-[10px] font-black uppercase text-red-400 leading-relaxed">
              <i className="fas fa-triangle-exclamation mr-2"></i>
              {locationError}
            </p>
            <button 
              onClick={requestLocation}
              className="mt-3 text-[8px] md:text-[9px] font-black uppercase text-white bg-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/30 transition-all"
            >
              Retry Access
            </button>
          </div>
        )}

        <div className="flex bg-white/5 p-1 md:p-1.5 rounded-xl md:rounded-2xl mb-6 md:mb-8">
          {[
            { id: 'walking', icon: 'fa-person-walking', label: 'Walk' },
            { id: 'cycling', icon: 'fa-bicycle', label: 'Cycle' },
            { id: 'driving', icon: 'fa-car', label: 'Drive' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => { setMode(m.id as any); if (location) fetchDirections(m.id as any); }}
              className={`flex-1 py-2 md:py-3 rounded-lg md:rounded-xl flex flex-col items-center gap-1 transition-all ${mode === m.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-300/40 hover:text-emerald-300'}`}
            >
              <i className={`fas ${m.icon} text-xs md:text-sm`}></i>
              <span className="text-[7px] md:text-[8px] font-black uppercase">{m.label}</span>
            </button>
          ))}
        </div>

        {directions ? (
          <div className="space-y-4 md:space-y-6 animate-slideUp">
             <div className="bg-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5">
                <p className="text-[10px] md:text-[11px] font-medium leading-relaxed mb-4 text-emerald-50">{directions.text}</p>
                
                {activeLoan && (
                  <div className="mb-4">
                    {isTraveling ? (
                      <button 
                        onClick={handleEndJourney}
                        className="w-full py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase shadow-lg flex items-center justify-center gap-3"
                        disabled={isLoading}
                      >
                        <i className="fas fa-stop"></i> End Live Tracking
                      </button>
                    ) : (
                      <button 
                        onClick={handleStartJourney}
                        className="w-full py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase shadow-lg flex items-center justify-center gap-3"
                        disabled={isLoading}
                      >
                        <i className="fas fa-play"></i> Start Live Tracking
                      </button>
                    )}
                  </div>
                )}

                {directions.links.length > 0 && (
                  <div className="space-y-2">
                    {directions.links.map((chunk: any, i: number) => (
                      chunk.maps && (
                        <a 
                          key={i} 
                          href={chunk.maps.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-emerald-600/50 rounded-xl text-[8px] md:text-[9px] font-black uppercase hover:bg-emerald-600 transition-all border border-white/10"
                        >
                          <i className="fas fa-map-location-dot"></i> View PTA Route
                        </a>
                      )
                    ))}
                  </div>
                )}
             </div>
             <button onClick={() => setDirections(null)} className="text-[8px] md:text-[9px] font-black uppercase text-emerald-500/60 hover:text-emerald-500">Reset View</button>
          </div>
        ) : (
          <div className="text-center py-4 md:py-8">
            <button 
              onClick={() => fetchDirections()}
              className="w-full py-4 md:py-6 bg-white text-emerald-950 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><i className="fas fa-route"></i> {location ? 'Calculate PTA' : 'Enable Location'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficeLocator;
