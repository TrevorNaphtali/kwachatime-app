
import React, { useState } from 'react';
import { ThemeMode, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  isAdmin?: boolean;
  viewMode?: 'ADMIN' | 'BORROWER';
  onToggleView?: () => void;
  onShowManual?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onOpenNotifications?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, themeMode, onToggleTheme, 
  isAdmin, viewMode, onToggleView, onShowManual,
  notifications = [], onMarkNotificationRead, onOpenNotifications
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-500`}>
      <header className="bg-emerald-800 dark:bg-emerald-950 text-white shadow-2xl sticky top-0 z-[100] border-b dark:border-emerald-900 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl shadow-inner group-hover:rotate-12 transition-transform">K</div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">KwachaTime</h1>
              <p className="text-[8px] font-black text-emerald-400 mt-1 hidden sm:block">Secure Micro-Lending</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            <button 
              onClick={onShowManual}
              className="p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-inner group"
            >
              <i className="fas fa-folder-open text-sm md:text-lg"></i>
              <span className="absolute top-full mt-3 right-0 bg-emerald-950 text-white text-[9px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap border border-emerald-800 shadow-2xl pointer-events-none transition-all">
                Document Vault
              </span>
            </button>

            {isAdmin && (
              <button 
                onClick={onToggleView}
                className="p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-inner group"
              >
                <i className={`fas ${viewMode === 'ADMIN' ? 'fa-user' : 'fa-shield-halved'} text-sm md:text-lg`}></i>
                <span className="absolute top-full mt-3 right-0 bg-emerald-950 text-white text-[9px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap border border-emerald-800 shadow-2xl pointer-events-none transition-all">
                  {viewMode === 'ADMIN' ? 'Borrower View' : 'Admin Panel'}
                </span>
              </button>
            )}
            <button 
              onClick={onToggleTheme}
              className="p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-sm w-10 h-10 md:w-12 md:h-12 flex items-center justify-center group relative shadow-inner"
            >
              <i className={`fas ${themeMode === 'light' ? 'fa-sun' : themeMode === 'dark' ? 'fa-moon' : 'fa-circle-half-stroke'} text-sm md:text-lg transition-transform group-active:scale-75`}></i>
              <span className="absolute top-full mt-3 right-0 bg-emerald-950 text-white text-[9px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap border border-emerald-800 shadow-2xl pointer-events-none transition-all">
                Mode: {themeMode?.charAt(0).toUpperCase() + themeMode?.slice(1)}
              </span>
            </button>

            {user && (
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="relative">
                  <button 
                    onClick={onOpenNotifications}
                    className="p-2 md:p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-inner"
                  >
                    <i className="fas fa-bell text-sm md:text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-black animate-bounce shadow-lg border-2 border-emerald-800">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] text-emerald-400 font-black">Operator ID: {user.id.slice(0, 6)}</span>
                  <span className="text-sm font-black">{user.name}</span>
                </div>
                
                <button 
                  onClick={onLogout} 
                  className="bg-white/10 border border-white/10 px-4 md:px-6 py-2 md:py-3 rounded-2xl text-[9px] md:text-[10px] font-black hover:bg-red-500/20 hover:border-red-500/30 transition-all shadow-lg active:scale-95"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-16">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t dark:border-slate-800 py-8 md:py-12 text-center text-gray-400 dark:text-gray-600 transition-colors">
        <div className="mb-6 flex justify-center gap-6 md:gap-8 text-lg md:text-xl">
          <i className="fab fa-facebook-messenger opacity-30 hover:opacity-100 transition-opacity cursor-pointer"></i>
          <i className="fab fa-whatsapp opacity-30 hover:opacity-100 transition-opacity cursor-pointer"></i>
          <i className="fas fa-headset opacity-30 hover:opacity-100 transition-opacity cursor-pointer"></i>
        </div>
        <p className="text-[8px] md:text-[10px] font-black px-4">&copy; 2026 KwachaTime Micro-Lending. All Rights Reserved. Lusaka, Zambia.</p>
      </footer>
    </div>
  );
};

export default Layout;
