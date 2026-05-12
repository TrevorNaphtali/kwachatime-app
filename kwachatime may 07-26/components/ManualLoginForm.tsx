import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { backend } from '../backend';
import { UserRole } from '../types';

interface ManualLoginFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ManualLoginForm: React.FC<ManualLoginFormProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await backend.register({
          id: userCred.user.uid,
          name: name || email.split('@')[0],
          email: email,
          nrc: 'PENDING',
          phone: 'PENDING',
          address: 'PENDING',
          operator: 'Airtel',
          role: 'BORROWER',
          joinedAt: new Date().toISOString(),
          walletBalance: 0,
          trustScore: 50
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn p-2">
      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-3xl mb-4">
        <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2">
          {isRegistering ? "Create Secure Account" : "Access Your Dashboard"}
        </p>
        <p className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70 leading-relaxed font-medium">
          {isRegistering 
            ? "Join KwachaTime to apply for institutional micro-loans instantly." 
            : "Sign in with your credentials to manage your loans and messaging."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
           <div className="space-y-1">
            <label className="text-[9px] font-black text-emerald-600 pl-4 uppercase">Full Name</label>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl shadow-inner border border-gray-100 dark:border-emerald-900/20 focus-within:border-emerald-500 transition-all">
              <input 
                type="text" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white placeholder:text-gray-400 text-[11px]"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-black text-emerald-600 pl-4 uppercase">Email Address</label>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl shadow-inner border border-gray-100 dark:border-emerald-900/20 focus-within:border-emerald-500 transition-all">
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white placeholder:text-gray-400 text-[11px]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-emerald-600 pl-4 uppercase">Password</label>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl shadow-inner border border-gray-100 dark:border-emerald-900/20 focus-within:border-emerald-500 transition-all">
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white placeholder:text-gray-400 text-[11px]"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl">
            <p className="text-red-600 dark:text-red-400 text-[9px] font-black text-center">{error}</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 hover:bg-emerald-900 dark:hover:bg-emerald-500 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <i className={`fas ${isRegistering ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>
              {isRegistering ? "Register Account" : "Secure Login"}
            </>
          )}
        </button>

        <div className="flex flex-col items-center gap-3 pt-2">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] font-bold text-emerald-600 hover:underline"
          >
            {isRegistering ? "Already have an account? Login" : "New user? Create an account"}
          </button>
          
          <button 
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-all"
          >
            Cancel and Return
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualLoginForm;
