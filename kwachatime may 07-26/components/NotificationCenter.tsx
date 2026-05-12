import React from 'react';
import { AppNotification } from '../types';
import { backend } from '../backend';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  isOpen, 
  onClose, 
  onMarkRead,
  onMarkAllRead 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-start justify-end p-4 md:p-8 pointer-events-none">
      <div 
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm pointer-events-auto" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden max-h-[80vh] pointer-events-auto"
      >
        <div className="p-8 bg-emerald-800 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tighter">Notifications</h3>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Communication Hub</p>
          </div>
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] font-black uppercase hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div 
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-6 rounded-3xl border transition-all ${
                  notif.read 
                    ? 'bg-white/50 dark:bg-slate-900/50 border-gray-50 dark:border-slate-800' 
                    : 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 shadow-sm ring-1 ring-emerald-500/5'
                }`}
                onClick={() => onMarkRead(notif.id)}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    notif.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                    notif.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                    notif.type === 'WARNING' ? 'bg-orange-100 text-orange-600' :
                    notif.type === 'MESSAGE' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <i className={`fas ${
                      notif.type === 'ERROR' ? 'fa-circle-exclamation' :
                      notif.type === 'SUCCESS' ? 'fa-circle-check' :
                      notif.type === 'WARNING' ? 'fa-triangle-exclamation' :
                      notif.type === 'MESSAGE' ? 'fa-comment-dots' :
                      'fa-bell'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate mb-1">
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[8px] font-black text-gray-300 mt-2 uppercase tracking-widest">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse mt-1"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Inbox Empty</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationCenter;
