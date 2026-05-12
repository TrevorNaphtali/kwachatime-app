import React, { useState, useEffect, useRef } from 'react';
import { backend } from '../backend';
import { User, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  currentUser: User;
  recipient: User | null; // Null for system/broadcast or if not selected
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipient) return;

    console.log(`[Chat] Starting thread with ${recipient.name}`);
    const unsubscribe = backend.subscribeToMessages(currentUser.id, recipient.id, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [recipient, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !recipient) return;

    setLoading(true);
    try {
      await backend.sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: recipient.id,
        content: inputText.trim()
      });
      setInputText('');
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setLoading(false);
    }
  };

  if (!recipient) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 z-[9999] w-full max-w-[360px] md:max-w-md bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden max-h-[600px] h-[80vh]"
    >
      {/* Header */}
      <div className="p-6 bg-emerald-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            <i className="fas fa-user"></i>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Messaging Room</p>
            <p className="text-sm font-bold opacity-90">{recipient.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950 scroll-smooth"
      >
        <div className="text-center py-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Encryption Verified & Logged
          </p>
        </div>

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id;
          return (
            <div 
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-3xl text-[11px] shadow-sm ${
                  isOwn 
                    ? 'bg-emerald-800 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-slate-700'
                }`}
              >
                <p className="font-medium leading-relaxed">{msg.content}</p>
                <p className={`text-[8px] mt-2 opacity-50 font-black ${isOwn ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
            <i className="fas fa-comments text-4xl mb-4"></i>
            <p className="text-[10px] font-black uppercase">No history found</p>
            <p className="text-[9px] max-w-[200px] mt-2">Start a conversation with management regarding your loan status.</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <div className="flex gap-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 px-5 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 focus-within:border-emerald-500 transition-all">
            <input 
              type="text" 
              placeholder="Type instruction or query..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-transparent outline-none text-[11px] font-bold dark:text-white"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !inputText.trim()}
            className="w-14 h-14 bg-emerald-800 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatWindow;
