import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { User, Loan, UserRole, ThemeMode, AuditLog, Transaction, OutgoingEmail, DocumentMetadata, AppNotification } from './types';
import Layout from './components/Layout';
import LoanForm from './components/LoanForm';
import Roadmap from './components/Roadmap';
import OfficeLocator from './components/OfficeLocator';
import CurrencyConverter from './components/CurrencyConverter';
import OnboardingTour from './components/OnboardingTour';
import LegalDocumentModal from './components/LegalDocumentModal';
import OperationalManual from './components/OperationalManual';
import ManualLoginForm from './components/ManualLoginForm';
import ChatWindow from './components/ChatWindow';
import NotificationCenter from './components/NotificationCenter';
import { formatCurrency } from './utils/loanCalculator';
import { apiService } from './services/apiService';
import { backend } from './backend';
import { generateAppIcon } from './services/geminiService';

const APP_VERSION = "1.4.1-BuildReady";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [outgoingEmails, setOutgoingEmails] = useState<OutgoingEmail[]>([]);
  const [allDocs, setAllDocs] = useState<DocumentMetadata[]>([]);
  const [vaultBalance, setVaultBalance] = useState<number>(0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [activeLegalDoc, setActiveLegalDoc] = useState<{ user?: User; loan?: Loan; type: 'AGREEMENT' | 'LETTER_OF_SALE' | 'CREDENTIAL_REPORT' } | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('theme-mode') as ThemeMode) || 'system');
  const [activeAdminTab, setActiveAdminTab] = useState<'MONITOR' | 'PENDING' | 'USERS' | 'SIMULATE' | 'BRANDING' | 'LOGS'>('MONITOR');
  const [viewMode, setViewMode] = useState<'ADMIN' | 'BORROWER'>('ADMIN');
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false); // For manual borrower login
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const [chatRecipient, setChatRecipient] = useState<User | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const [simName, setSimName] = useState('');
  const [simPrincipal, setSimPrincipal] = useState('');
  
  const [showSwitchPasswordModal, setShowSwitchPasswordModal] = useState(false);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState(false);
  const [showLoginHelp, setShowLoginHelp] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const effectiveTheme = themeMode === 'system' ? systemTheme : themeMode;
    if (effectiveTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener('pwa-update-available', handleUpdate);
    return () => window.removeEventListener('pwa-update-available', handleUpdate);
  }, []);

  const isAdmin = useMemo(() => currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER', [currentUser]);
  
  const activeLoan = useMemo(() => 
    allLoans.find(l => l.userId === currentUser?.id && !['REPAID', 'REJECTED'].includes(l.status)),
    [allLoans, currentUser]
  );

  // Real-time Data Sync
  useEffect(() => {
    if (!currentUser || !auth.currentUser) return;

    let unsubscribe: () => void;

    if (isAdmin) {
      console.log("[Sync] Initializing real-time Admin listener...");
      unsubscribe = apiService.subscribeToStats((stats) => {
        setAllLoans(stats.loans);
        setAllUsers(stats.users);
        setVaultBalance(stats.vaultBalance);
        setAuditLogs(stats.auditLogs);
        setOutgoingEmails(stats.outgoingEmails);
        setAllDocs(stats.documents || []);
        
        // Keep profile synced
        const self = stats.users.find(u => u.id === currentUser.id);
        if (self) setCurrentUser(self);
      });
    } else {
      console.log("[Sync] Initializing real-time Borrower listener...");
      unsubscribe = apiService.subscribeToUserLoans(currentUser.id, (loans) => {
        setAllLoans(loans);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser, isAdmin]);

  // Handle Redirect Result for Mobile/APK
  useEffect(() => {
    // 1. Check for Auth Redirect Result
    const handleRedirect = async () => {
      console.log("[Auth] Checking for redirect result...");
      setIsLoggingIn(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("[Auth] Redirect sign-in successful:", result.user.email);
        }
      } catch (error: any) {
        console.error("[Auth] Redirect sign-in error:", error);
        if (error.code === 'auth/unauthorized-domain') {
          alert(`CRITICAL: This domain (${window.location.hostname}) is not authorized in your Firebase Console.\n\nGo to: Authentication > Settings > Authorized Domains and add "${window.location.hostname}"`);
        } else if (error.code === 'auth/internal-error') {
          alert("Firebase Internal Error. This often happens in APKs if Google Play Services are outdated or the WebView is restricted.");
        }
      } finally {
        setIsLoggingIn(false);
      }
    };
    handleRedirect();

    // 2. Handle Android Hardware Back Button (For APKs)
    // We use history states to trigger a 'back' behavior that closes modals instead of exiting the app.
    const handlePopState = (event: PopStateEvent) => {
      if (activeLegalDoc) {
        setActiveLegalDoc(null);
        event.preventDefault();
        window.history.pushState(null, "", "");
      } else if (showManual) {
        setShowManual(false);
        event.preventDefault();
        window.history.pushState(null, "", "");
      } else if (showAdminLogin) {
        setShowAdminLogin(false);
        event.preventDefault();
        window.history.pushState(null, "", "");
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Push a dummy state so there is something to go 'back' from
    window.history.pushState(null, "", "");

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeLegalDoc, showManual, showAdminLogin]);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("[Auth] Initializing onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth] Auth state changed. User:", firebaseUser?.email || "None");
      setIsLoggingIn(true);
      try {
        if (firebaseUser) {
          console.log("[Auth] Fetching user profile from Firestore:", firebaseUser.uid);
          const user = await apiService.getUser(firebaseUser.uid);
          if (user) {
            console.log("[Auth] User profile found:", user.role);
            // Auto-upgrade to ADMIN if email matches but role is BORROWER
            if (user.role === 'BORROWER' && (user.email === 'naphtali.tre@gmail.com' || user.email === 'ocmwila@networkit.info' || user.email === 'pa@networkit.info' || user.email === 'naphtali@networkit.info')) {
              console.log("[Auth] Auto-upgrading user to ADMIN");
              const upgradedUser = { ...user, role: 'ADMIN' as UserRole };
              await apiService.syncUser(upgradedUser);
              setCurrentUser(upgradedUser);
            } else {
              setCurrentUser(user);
            }
          } else {
            console.log("[Auth] User profile not found. Auto-registering...");
            // Auto-register if not in DB (for demo purposes)
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New Borrower',
              email: firebaseUser.email || '',
              nrc: 'PENDING',
              phone: 'PENDING',
              address: 'PENDING',
              operator: 'Airtel',
              role: (firebaseUser.email === 'naphtali.tre@gmail.com' || firebaseUser.email === 'ocmwila@networkit.info' || firebaseUser.email === 'pa@networkit.info' || firebaseUser.email === 'naphtali@networkit.info') ? 'ADMIN' : 'BORROWER',
              joinedAt: new Date().toISOString(),
              walletBalance: 0,
              trustScore: 50
            };
            await apiService.syncUser(newUser);
            setCurrentUser(newUser);
          }
        } else {
          console.log("[Auth] No Firebase user. Checking manual session...");
          // Check for manual admin session
          const manualEmail = localStorage.getItem('manual-admin-email');
          if (manualEmail) {
            console.log("[Auth] Found manual session for:", manualEmail);
            const user = await apiService.getUserByEmail(manualEmail);
            if (user) {
              setCurrentUser({ ...user, role: 'ADMIN' as UserRole });
            } else {
              console.log("[Auth] Manual session user not found in DB.");
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error: any) {
        console.error("[Auth] Error in auth state change handler:", error);
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('permission-denied')) {
          alert(`Database Access Denied: Your Firestore Security Rules are blocking your account. \n\nEnsure your email is in the Admin list if you are trying to access the vault.`);
        } else {
          alert(`Connection Error: ${errorMsg}. \n\nCheck if your Firebase Project ID and API Key are correct in the config file.`);
        }
      } finally {
        console.log("[Auth] Auth readiness set to true");
        setIsAuthReady(true);
        setIsLoggingIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Notifications Subscription
  useEffect(() => {
    if (!currentUser || !auth.currentUser) return;

    console.log("[Sync] Listening for real-time notifications...");
    const unsubscribe = backend.subscribeToNotifications(currentUser.id, (notifs) => {
      setNotifications(notifs);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleMarkNotificationRead = async (id: string) => {
    await backend.markNotificationRead(id);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    await backend.markAllNotificationsRead(currentUser.id);
  };

  // Real-time Firestore Listeners for Admin
  useEffect(() => {
    if (!currentUser || !isAdmin || !auth.currentUser) return;

    const qDocs = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setAllDocs(snapshot.docs.map(d => d.data() as DocumentMetadata));
    }, (error) => {
      console.error("Docs snapshot error:", error);
    });

    const qLoans = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsubLoans = onSnapshot(qLoans, (snapshot) => {
      setAllLoans(snapshot.docs.map(d => d.data() as Loan));
    }, (error) => {
      console.error("Loans snapshot error:", error);
    });

    return () => {
      unsubDocs();
      unsubLoans();
    };
  }, [currentUser, isAdmin]);

  // Borrower Live Tracking
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'BORROWER') return;

    const activeTravelLoan = allLoans.find(l => l.userId === currentUser.id && l.isTravelingToSite);
    
    if (!activeTravelLoan) {
      setLocationError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        apiService.updateLocation(currentUser.id, {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString()
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Location tracking error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please enable location permissions in your browser settings to allow live tracking to the office.");
        } else {
          setLocationError("Unable to retrieve your location for tracking.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentUser, allLoans]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    // Force account selection
    provider.setCustomParameters({ prompt: 'select_account' });
    
    setIsProcessing(true);
    try {
      // Check if we are in a mobile/APK environment
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isWebView = /wv|Version\/[\d\.]+/i.test(navigator.userAgent) || (isMobile && !/Chrome|Safari/i.test(navigator.userAgent));

      if (isMobile || isWebView) {
        // Use redirect for mobile/APK as popups are often blocked or fail in WebViews
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login failed", error);
      setIsProcessing(false);
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(`This domain (${currentDomain}) is not authorized for login. \n\nPlease add it to your Firebase Console under: \nAuthentication > Settings > Authorized Domains`);
      } else if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect if popup is blocked
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          alert("Login failed. Please ensure you are using a standard browser like Chrome or Safari.");
        }
      } else {
        alert(`Login failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleAdminLogin = async () => {
    setAdminLoginError(null);
    if (adminPassword !== 'kwachatime') {
      setAdminLoginError("Invalid Access Key.");
      return;
    }

    setIsProcessing(true);
    try {
      const authorizedAdmins = ['naphtali.tre@gmail.com', 'ocmwila@networkit.info', 'pa@networkit.info', 'naphtali@networkit.info'];
      
      // Attempt to find user by email to support both administrators and borrowers
      let user = await apiService.getUserByEmail(adminEmail.toLowerCase().trim());
      
      if (user) {
        // If they exist, log them in with their actual profile
        console.log("[Auth] Manual login successful for existing user:", user.email);
        // Force admin role if they are in the authorized list
        if (authorizedAdmins.includes(user.email)) {
          user = { ...user, role: 'ADMIN' };
        }
        setCurrentUser(user);
        localStorage.setItem('manual-admin-email', adminEmail.toLowerCase().trim());
      } else {
        // If not found, check if it's a new admin entry or a mistake
        if (authorizedAdmins.includes(adminEmail.toLowerCase().trim())) {
          console.log("[Auth] Manual login: Creating temporary admin record");
          const tempAdmin: User = {
            id: `ADMIN-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            email: adminEmail.toLowerCase().trim(),
            name: adminEmail.split('@')[0],
            role: 'ADMIN',
            walletBalance: 0,
            joinedAt: new Date().toISOString(),
            nrc: 'ADMIN-NRC',
            phone: '0000000000',
            address: 'Admin Office',
            operator: 'Airtel'
          };
          setCurrentUser(tempAdmin);
          localStorage.setItem('manual-admin-email', adminEmail.toLowerCase().trim());
        } else {
          setAdminLoginError("Profile not found. Please sign in with Google first to register your identity.");
        }
      }
    } catch (error: any) {
      console.error("[Auth] Manual login failed:", error);
      setAdminLoginError("Connection failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('manual-admin-email');
    setCurrentUser(null);
  };

  const handleGenerateIcon = async () => {
    try {
      setIsGeneratingIcon(true);
      const icon = await generateAppIcon();
      setGeneratedIcon(icon);
    } catch (error: any) {
      console.error("Failed to generate icon", error);
      if (error.message?.includes("permission denied") || error.message?.includes("not found")) {
        alert("Permission denied. Please select your own Gemini API key in the Branding section to use this feature.");
      } else {
        alert("Failed to generate icon. Please try again.");
      }
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const handleSelectApiKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    } else {
      alert("API Key selection is not available in this environment.");
    }
  };

  const handleManualStatusUpdate = async (loanId: string, status: Loan['status']) => {
    setIsProcessing(true);
    try {
      if (status === 'DISBURSED') {
        await apiService.disburseLoan(loanId);
      } else {
        await apiService.updateLoanStatus(loanId, status);
      }
    } catch (e) {} finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthReady || isLoggingIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-[10px] font-black text-emerald-600 animate-pulse uppercase tracking-widest">
          {isLoggingIn ? "Securing Session..." : "Initializing Vault..."}
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Layout 
        themeMode={themeMode} 
        onToggleTheme={() => {
          const modes: ThemeMode[] = ['light', 'dark', 'system'];
          const nextIndex = (modes.indexOf(themeMode as any) + 1) % modes.length;
          setThemeMode(modes[nextIndex] as any);
        }}
        isAdmin={true} 
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'ADMIN' ? 'BORROWER' : 'ADMIN')}
        onShowManual={() => setShowManual(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenNotifications={() => setShowNotificationCenter(true)}
      >
        <div className="flex items-center justify-center min-h-screen p-4 py-10 md:py-20">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center transition-all">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
               <i className="fas fa-landmark text-4xl"></i>
            </div>
            <h2 className="text-4xl font-black text-emerald-950 dark:text-white tracking-tighter mb-4">Vault Entrance</h2>
            <p className="text-[11px] font-black text-emerald-600 mb-10 italic">Zambian Micro-Lending Portal</p>
            
            <div className="space-y-8">
              {showManualLogin ? (
                <ManualLoginForm 
                  onSuccess={() => setShowManualLogin(false)} 
                  onCancel={() => setShowManualLogin(false)} 
                />
              ) : showAdminLogin ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-3xl mb-6">
                    <p className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-2">Manual Access Mode</p>
                    <p className="text-[9px] text-orange-700/70 dark:text-orange-400/70 leading-relaxed">
                      Use this if Google Login is blocked on your device.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-emerald-600 pl-4">Your Email</label>
                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-inner border border-emerald-900/20 group focus-within:border-emerald-500 transition-all">
                      <input 
                        type="email" 
                        placeholder="" 
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-transparent outline-none font-black text-white placeholder:text-gray-700 text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-emerald-600 pl-4">Access Key</label>
                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-inner border border-emerald-900/20 group focus-within:border-emerald-500 transition-all">
                      <input 
                        type="password" 
                        placeholder="" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-transparent outline-none font-black text-white placeholder:text-gray-700 text-[11px]"
                      />
                    </div>
                  </div>
                  {adminLoginError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <p className="text-red-500 text-[9px] font-black text-center animate-pulse">{adminLoginError}</p>
                    </div>
                  )}
                  <button 
                    onClick={handleAdminLogin}
                    disabled={isProcessing}
                    className="w-full py-7 bg-emerald-800 text-white rounded-[2.5rem] font-black shadow-2xl transition-all active:scale-95 hover:bg-emerald-900 flex items-center justify-center gap-4 group"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><i className="fas fa-key group-hover:rotate-12 transition-transform"></i> Access Vault</>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowAdminLogin(false)}
                    className="w-full text-[10px] font-black text-gray-400 hover:text-emerald-600 transition-all py-2"
                  >
                    Back to Google Login
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <button 
                    onClick={() => setShowManualLogin(true)}
                    className="w-full py-7 bg-emerald-800 text-white rounded-[2.5rem] font-black shadow-2xl transition-all active:scale-95 hover:bg-emerald-900 flex items-center justify-center gap-4 group"
                  >
                    <i className="fas fa-right-to-bracket"></i> Manual Auth
                  </button>

                  <div className="flex items-center gap-4 py-4">
                    <div className="h-[1px] flex-grow bg-gray-100 dark:bg-slate-800"></div>
                    <span className="text-[9px] font-black text-gray-300">OR</span>
                    <div className="h-[1px] flex-grow bg-gray-100 dark:bg-slate-800"></div>
                  </div>

                  <button 
                    onClick={handleLogin}
                    disabled={isProcessing}
                    className="w-full py-5 border-2 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 rounded-[2rem] text-[10px] font-black hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><i className="fab fa-google"></i> Continue with Google</>
                    )}
                  </button>

                  <button 
                    onClick={() => setShowTroubleshoot(true)}
                    className="w-full text-[9px] font-black text-gray-400 hover:text-emerald-600 transition-all"
                  >
                    Login Issues? Troubleshoot
                  </button>
                </div>
              )}
              <div className="pt-8 border-t border-gray-50 dark:border-slate-800">
                <p className="text-[10px] font-bold text-gray-400">Authorized Access Only • 2026 Build</p>
              </div>
            </div>
            <p className="mt-12 text-[9px] font-black text-gray-300">v{APP_VERSION}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      themeMode={themeMode} 
      onToggleTheme={() => {
        const modes: ThemeMode[] = ['light', 'dark', 'system'];
        const nextIndex = (modes.indexOf(themeMode as any) + 1) % modes.length;
        setThemeMode(modes[nextIndex] as any);
      }}
      isAdmin={isAdmin}
      viewMode={viewMode}
      onToggleView={() => {
        if (viewMode === 'ADMIN') {
          setShowSwitchPasswordModal(true);
        } else {
          setViewMode('ADMIN');
        }
      }}
      onShowManual={() => setShowManual(true)}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onOpenNotifications={() => setShowNotificationCenter(true)}
    >
      
      {locationError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-md p-4 animate-slideDown">
          <div className="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl border-2 border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <i className="fas fa-location-dot text-2xl animate-pulse"></i>
              <div>
                <p className="text-[10px] font-black">Tracking Error</p>
                <p className="text-[11px] font-medium opacity-90">{locationError}</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white text-red-600 rounded-xl font-black text-[10px] shadow-lg"
            >
              Retry Access
            </button>
          </div>
        </div>
      )}

      {updateAvailable && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-sm p-4 animate-slideUp">
          <div className="bg-orange-600 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 border-2 border-white/20">
            <div className="flex items-center gap-4">
              <i className="fas fa-rotate text-xl animate-spin"></i>
              <div>
                <p className="text-[10px] font-black">Update Available</p>
                <p className="text-[9px] font-medium opacity-80">Reload to apply latest v{APP_VERSION}</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-[10px] shadow-lg"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {activeLegalDoc && (
        <LegalDocumentModal 
          user={activeLegalDoc.user || currentUser}
          loan={activeLegalDoc.loan}
          type={activeLegalDoc.type}
          onClose={() => setActiveLegalDoc(null)}
        />
      )}

      {showManual && (
        <OperationalManual 
          onClose={() => setShowManual(false)} 
          documents={allDocs.filter(d => d.borrowerId === currentUser?.id)}
          currentUser={currentUser}
        />
      )}

      {showTroubleshoot && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-2xl font-black mb-4">Login Troubleshooter</h3>
            <p className="text-[11px] text-gray-500 mb-8 leading-relaxed">
              If Google Login is failing in the APK, it's likely due to WebView restrictions or domain authorization.
            </p>
            
            <div className="space-y-4 mb-10">
              <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-3xl">
                <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase">Step 1: Check Domains</p>
                <p className="text-[9px] text-gray-400">Ensure these are in Firebase Authorized Domains:</p>
                <code className="block mt-2 text-[8px] bg-white dark:bg-slate-950 p-3 rounded-lg break-all">
                  {window.location.hostname}<br/>
                  ais-dev-mq4tzj6sw5mfthipshk65p-270948637973.europe-west2.run.app
                </code>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-3xl">
                <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase">Step 2: Try Different Method</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={async () => {
                      setIsProcessing(true);
                      const provider = new GoogleAuthProvider();
                      try { await signInWithPopup(auth, provider); } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
                    }}
                    className="py-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl text-[9px] font-black"
                  >
                    Force Popup
                  </button>
                  <button 
                    onClick={async () => {
                      setIsProcessing(true);
                      const provider = new GoogleAuthProvider();
                      try { await signInWithRedirect(auth, provider); } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
                    }}
                    className="py-4 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl text-[9px] font-black"
                  >
                    Force Redirect
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowTroubleshoot(false)}
              className="w-full py-6 bg-emerald-800 text-white rounded-[2rem] font-black text-[11px] shadow-lg"
            >
              Close Troubleshooter
            </button>
          </div>
        </div>
      )}

      {showSwitchPasswordModal && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 text-center animate-scaleIn">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Security Verification</h3>
            <p className="text-[11px] text-gray-500 mb-8 font-medium">Enter the vault access key to switch to Borrower view.</p>
            
            <div className="bg-slate-900 p-6 rounded-[2rem] shadow-inner border border-emerald-900/20 mb-6 group focus-within:border-emerald-500 transition-all">
              <input 
                type="password" 
                placeholder="Access Key" 
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (switchPassword === 'kwachatime') {
                      setViewMode('BORROWER');
                      setShowSwitchPasswordModal(false);
                      setSwitchPassword('');
                      setSwitchError(false);
                    } else {
                      setSwitchError(true);
                    }
                  }
                }}
                className="w-full bg-transparent outline-none font-black text-white placeholder:text-gray-700 text-center text-lg"
                autoFocus
              />
            </div>

            {switchError && (
              <p className="text-red-500 text-[10px] font-black mb-6 animate-pulse">Invalid Access Key</p>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => { setShowSwitchPasswordModal(false); setSwitchPassword(''); setSwitchError(false); }}
                className="flex-1 py-5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (switchPassword === 'kwachatime') {
                    setViewMode('BORROWER');
                    setShowSwitchPasswordModal(false);
                    setSwitchPassword('');
                    setSwitchError(false);
                  } else {
                    setSwitchError(true);
                  }
                }}
                className="flex-1 py-5 bg-emerald-800 text-white rounded-2xl font-black text-[10px] shadow-lg hover:bg-emerald-900 transition-all active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && viewMode === 'ADMIN' ? (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Management Console</h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Institutional Oversight & Governance</p>
            </div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 text-emerald-500 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-2" title="Real-time Sync Active">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[8px] font-black uppercase">Live</span>
                </div>
              <button 
                onClick={() => setViewMode('BORROWER')}
                className="px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[10px] shadow-lg hover:bg-emerald-900 transition-all"
              >
                Switch to Borrower
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 text-white p-8 rounded-[3.5rem] mb-6 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
               <p className="text-[10px] font-black text-emerald-400 mb-1 relative z-10">Portfolio Liquidity</p>
               <p className="text-3xl font-black relative z-10">{formatCurrency(vaultBalance)}</p>
               <p className="text-[8px] font-bold text-gray-500 mt-2 relative z-10">Vault Status: SECURE</p>
            </div>
            {[
              { id: 'MONITOR', icon: 'fa-chart-line', label: 'Monitor' },
              { id: 'PENDING', icon: 'fa-shield-halved', label: 'Approvals' },
              { id: 'USERS', icon: 'fa-address-book', label: 'Client Registry' },
              { id: 'SIMULATE', icon: 'fa-vial-circle-check', label: 'Simulation' },
              { id: 'BRANDING', icon: 'fa-palette', label: 'Branding' },
              { id: 'LOGS', icon: 'fa-list-check', label: 'Audit Trail' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`w-full flex items-center gap-5 p-6 rounded-[2.5rem] text-[11px] font-black transition-all group ${activeAdminTab === tab.id ? 'bg-emerald-800 text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              >
                <i className={`fas ${tab.icon} w-6 text-lg group-hover:rotate-12 transition-transform`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-8">
            {activeAdminTab === 'USERS' && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl">
                 <div className="flex justify-between items-center mb-10">
                   <h3 className="text-2xl font-black">Client Credential Ledger (2026)</h3>
                   <i className="fas fa-file-pdf text-emerald-100 dark:text-slate-800 text-4xl"></i>
                 </div>
                 <div className="space-y-4">
                    {allUsers.filter(u => u.id !== 'SIM-USER').map(u => {
                      const latestLoan = allLoans.find(l => l.userId === u.id);
                      return (
                        <div key={u.id} className="p-8 bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center border border-gray-100 dark:border-slate-700 gap-6">
                          <div className="flex items-center gap-6 w-full">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-700">
                               <i className="fas fa-user text-emerald-800 dark:text-emerald-400"></i>
                            </div>
                            <div>
                              <p className="text-xl font-black">{u.name}</p>
                              <p className="text-[10px] text-emerald-600 font-bold">NRC: {u.nrc} • Phone: {u.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                             {allDocs?.find(d => d.borrowerId === u.id && d.type === 'CREDENTIAL_REPORT') ? (
                               <a 
                                 href={allDocs.find(d => d.borrowerId === u.id && d.type === 'CREDENTIAL_REPORT')?.url} 
                                 download={`KYC_${u.name}.pdf`}
                                 className="px-6 py-4 bg-blue-700 text-white rounded-2xl text-[9px] font-black hover:bg-blue-900 transition-all flex items-center gap-3 shadow-lg whitespace-nowrap"
                               >
                                 <i className="fas fa-download"></i> Download KYC
                               </a>
                             ) : (
                               <button 
                                 onClick={() => setActiveLegalDoc({ user: u, loan: latestLoan, type: 'CREDENTIAL_REPORT' })}
                                 className="px-6 py-4 bg-emerald-800 text-white rounded-2xl text-[9px] font-black hover:bg-emerald-950 transition-all flex items-center gap-3 shadow-lg whitespace-nowrap"
                               >
                                 <i className="fas fa-id-card"></i> Export KYC PDF
                               </button>
                             )}
                             <button 
                               onClick={() => setChatRecipient(u)}
                               className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-emerald-600 rounded-2xl text-[10px] font-black hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
                             >
                               <i className="fas fa-comments group-hover:scale-110 transition-transform"></i>
                             </button>
                          </div>
                        </div>
                      );
                    })}
                    {allUsers.filter(u => u.id !== 'SIM-USER').length === 0 && (
                      <div className="py-20 text-center text-gray-300 font-black">No clients registered in ledger</div>
                    )}
                 </div>
              </div>
            )}

            {activeAdminTab === 'BRANDING' && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-xl border border-gray-100 dark:border-slate-800 animate-fadeIn">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-3xl flex items-center justify-center text-2xl shadow-inner">
                    <i className="fas fa-palette"></i>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-emerald-950 dark:text-white tracking-tighter">Identity & Branding</h3>
                    <p className="text-[10px] font-black text-emerald-600">AI-Driven Visual Asset Generation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="p-8 bg-gray-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 mb-4">App Icon Generator</h4>
                      <p className="text-[11px] text-gray-500 mb-8 leading-relaxed">Generate a professional, institution-grade app icon using Google Gemini. The AI will craft a visual identity based on the KwachaTime brand values.</p>
                      <button 
                        onClick={handleGenerateIcon}
                        disabled={isGeneratingIcon}
                        className="w-full py-6 bg-emerald-800 text-white rounded-2xl font-black text-[10px] shadow-xl hover:bg-emerald-950 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                        {isGeneratingIcon ? (
                          <><i className="fas fa-spinner fa-spin"></i> Generating Identity...</>
                        ) : (
                          <><i className="fas fa-wand-magic-sparkles"></i> Generate App Icon</>
                        )}
                      </button>
                    </div>

                    <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl border border-emerald-500/20">
                      <h4 className="text-xs font-black text-emerald-400 mb-4">Advanced Configuration</h4>
                      <p className="text-[11px] text-gray-400 mb-8 leading-relaxed">To use high-quality image generation features, you must provide a valid Gemini API key with appropriate permissions.</p>
                      <button 
                        onClick={handleSelectApiKey}
                        className="w-full py-6 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-[10px] hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-4"
                      >
                        <i className="fas fa-key"></i> Select Custom API Key
                      </button>
                      <p className="text-[8px] text-gray-600 mt-4 text-center">Billing documentation: ai.google.dev/gemini-api/docs/billing</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-12 bg-gray-100 dark:bg-slate-800/30 rounded-[3.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700 min-h-[400px]">
                    {generatedIcon ? (
                      <div className="text-center animate-scaleIn">
                        <div className="relative group">
                          <img 
                            src={generatedIcon} 
                            alt="Generated Icon" 
                            className="w-64 h-64 rounded-[3rem] shadow-2xl mb-8 border-8 border-white dark:border-slate-900 group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem] flex items-center justify-center">
                             <i className="fas fa-check-circle text-white text-5xl"></i>
                          </div>
                        </div>
                        <a 
                          href={generatedIcon} 
                          download="kwachatime-icon.png"
                          className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 rounded-2xl font-black text-[10px] shadow-lg hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <i className="fas fa-download"></i> Download Asset
                        </a>
                      </div>
                    ) : (
                      <div className="text-center text-gray-300 dark:text-gray-600">
                        <i className="fas fa-image text-8xl mb-6 opacity-20"></i>
                        <p className="text-[10px] font-black">Awaiting Asset Generation</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'PENDING' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-3xl flex items-center justify-center text-2xl shadow-inner">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-orange-950 dark:text-white tracking-tighter">Approval Queue</h3>
                    <p className="text-[10px] font-black text-orange-600">Awaiting Institutional Verification</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {allLoans.filter(l => l.status === 'PENDING').map(loan => {
                    const borrower = allUsers.find(u => u.id === loan.userId);
                    return (
                      <div key={loan.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border border-gray-100 dark:border-slate-800 group hover:border-orange-500/30 transition-all">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
                          <div className="flex gap-8 items-center">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                               <i className="fas fa-file-invoice-dollar text-4xl text-gray-200 dark:text-slate-700"></i>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-orange-600 mb-2">Request ID: {loan.id}</p>
                              <h4 className="text-3xl font-black text-slate-900 dark:text-white">{loan.userName}</h4>
                              <p className="text-4xl font-black mt-2 text-emerald-900 dark:text-emerald-400 tracking-tighter">{formatCurrency(loan.principal)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
                             {allDocs?.find(d => d.loanId === loan.id && d.type === 'LOAN_AGREEMENT') && (
                               <a 
                                 href={allDocs.find(d => d.loanId === loan.id && d.type === 'LOAN_AGREEMENT')?.url} 
                                 download={`Agreement_${loan.id}.pdf`} 
                                 className="px-6 py-4 bg-emerald-900 text-white rounded-2xl text-[9px] font-black shadow-lg text-center hover:bg-emerald-950 transition-all"
                               >
                                 <i className="fas fa-file-contract mr-2"></i> Agreement
                               </a>
                             )}
                             <button 
                               onClick={() => setActiveLegalDoc({ user: borrower, loan, type: 'CREDENTIAL_REPORT' })} 
                               className="px-6 py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                             >
                               <i className="fas fa-id-card"></i> KYC Report
                             </button>
                             <button 
                               onClick={() => setActiveLegalDoc({ user: borrower, loan, type: 'AGREEMENT' })} 
                               className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black shadow-lg hover:bg-black transition-all"
                             >
                               Draft Contract
                             </button>
                             <button 
                               onClick={() => setActiveLegalDoc({ user: borrower, loan, type: 'LETTER_OF_SALE' })} 
                               className="px-6 py-4 bg-orange-600 text-white rounded-2xl text-[9px] font-black shadow-lg hover:bg-orange-700 transition-all"
                             >
                               Sale Letter
                             </button>
                          </div>
                        </div>
                        
                        <div className="flex gap-6 pt-10 border-t border-gray-50 dark:border-slate-800">
                           <button 
                             onClick={() => handleManualStatusUpdate(loan.id, 'APPROVED')} 
                             className="flex-1 py-6 bg-emerald-800 text-white rounded-[2rem] font-black text-[11px] shadow-xl hover:bg-emerald-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                           >
                             <i className="fas fa-check-circle"></i> Approve Payout
                           </button>
                           <button 
                             onClick={() => handleManualStatusUpdate(loan.id, 'REJECTED')} 
                             className="flex-1 py-6 bg-red-800 text-white rounded-[2rem] font-black text-[11px] shadow-xl hover:bg-red-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                           >
                             <i className="fas fa-times-circle"></i> Reject Request
                           </button>
                        </div>
                      </div>
                    );
                  })}
                  {allLoans.filter(l => l.status === 'PENDING').length === 0 && (
                    <div className="py-32 text-center text-gray-300 font-black border-2 border-dashed rounded-[4rem]">Queue Cleared</div>
                  )}
                </div>
              </div>
            )}

            {activeAdminTab === 'SIMULATE' && (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-xl border border-gray-100 dark:border-slate-800 animate-fadeIn">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 rounded-3xl flex items-center justify-center text-2xl shadow-inner">
                    <i className="fas fa-vial-circle-check"></i>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-indigo-950 dark:text-white tracking-tighter">Simulation Stress Engine</h3>
                    <p className="text-[10px] font-black text-indigo-600">Synthetic Scenario Injection</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-indigo-600 pl-4">Scenario Subject</label>
                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-inner border border-indigo-900/20 group focus-within:border-indigo-500 transition-all">
                      <input 
                        type="text" 
                        placeholder="e.g. High-Risk Default" 
                        value={simName} 
                        onChange={(e) => setSimName(e.target.value)} 
                        className="w-full bg-transparent outline-none font-black text-white placeholder:text-gray-700 text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-indigo-600 pl-4">Principal ZMW</label>
                    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-inner border border-indigo-900/20 group focus-within:border-indigo-500 transition-all">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={simPrincipal} 
                        onChange={(e) => setSimPrincipal(e.target.value)} 
                        className="w-full bg-transparent outline-none font-black text-white placeholder:text-gray-700 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => apiService.simulateLoan({ 
                    name: simName, 
                    principal: parseFloat(simPrincipal), 
                    disbursedDate: new Date().toISOString(), 
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString() 
                  }).then(() => { setSimName(''); setSimPrincipal(''); })}
                  className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black shadow-2xl transition-all active:scale-95 hover:bg-indigo-700 flex items-center justify-center gap-4 group"
                >
                  <i className="fas fa-bolt group-hover:scale-110 transition-transform"></i>
                  Inject Scenario Model
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
           <div className="lg:col-span-1 space-y-8 md:space-y-12">
              <Roadmap />
              <OfficeLocator activeLoan={activeLoan} />
           </div>
           
           <div className="lg:col-span-2 space-y-8 md:space-y-12">
              <div className="bg-emerald-950 text-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end border border-emerald-900 gap-6">
                 <div>
                    <p className="text-[10px] md:text-[11px] font-black text-emerald-500 mb-2 md:mb-3">Active Credit Record (2026)</p>
                    <p className="text-4xl md:text-6xl font-black tracking-tighter">{formatCurrency(currentUser.walletBalance || 0)}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={async () => {
                        const admins = allUsers.filter(u => u.role === 'ADMIN');
                        if (admins.length > 0) {
                          setChatRecipient(admins[0]);
                        } else {
                          alert("Management is currently offline. Please try again later.");
                        }
                      }}
                      className="p-5 bg-white/10 rounded-2xl hover:bg-white/20 transition-all flex items-center gap-3 border border-white/10 group"
                    >
                      <i className="fas fa-comment-dots text-xl group-hover:scale-110 transition-transform"></i>
                      <span className="text-[10px] font-black uppercase">Message Agent</span>
                    </button>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-2xl md:text-3xl shadow-inner text-emerald-400">
                        <i className="fas fa-coins"></i>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                 <h3 className="text-[10px] font-black text-gray-400 pl-6">Financial History</h3>
                 {allLoans.length === 0 ? (
                   <div className="py-20 md:py-32 text-center bg-gray-50 dark:bg-slate-900 rounded-[2rem] md:rounded-[4rem] text-gray-300 font-black border-2 border-dashed">No Active Records</div>
                 ) : (
                   allLoans.map(loan => (
                    <div key={loan.id} className="p-6 md:p-10 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[4rem] shadow-xl border-2 border-gray-50 dark:border-slate-800 animate-slideUp transition-all">
                       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div>
                             <p className="text-[9px] md:text-[10px] font-black text-gray-400 mb-1">REQ: {loan.id}</p>
                             <h4 className="text-2xl md:text-3xl font-black">{formatCurrency(loan.principal)}</h4>
                             <p className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-lg text-[8px] md:text-[9px] font-black mt-2 md:mt-3 inline-block">{loan.collateralDescription}</p>
                          </div>
                          <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black shadow-lg text-white ${loan.status === 'PENDING' ? 'bg-orange-500' : 'bg-emerald-700'}`}>
                             {loan.status}
                          </div>
                       </div>
                    </div>
                   ))
                 )}
              </div>

              <LoanForm 
                isLoading={isSubmittingLoan}
                onSubmit={async (data) => {
                  setIsSubmittingLoan(true);
                  try {
                    const loan: Loan = {
                      id: `RQ-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                      userId: currentUser.id,
                      userName: currentUser.name,
                      principal: parseFloat(data.principal),
                      purpose: data.purpose,
                      tenure: data.tenure,
                      repaymentMethod: data.repaymentMethod,
                      status: 'PENDING',
                      createdAt: new Date().toISOString(),
                      dueDate: new Date(Date.now() + parseInt(data.tenure) * 24 * 60 * 60 * 1000).toISOString(),
                      borrowerNRC: data.borrowerNRC,
                      borrowerPhoto: data.borrowerPhoto,
                      collateralType: data.collateralType,
                      collateralDescription: data.collateralDescription,
                      collateralSerial: data.collateralSerial,
                      collateralCondition: data.collateralCondition,
                      collateralLocation: data.collateralLocation,
                      hasAgreedToOwnership: data.hasAgreedToOwnership,
                      hasAgreedToVerification: data.hasAgreedToVerification,
                      statusHistory: []
                    };
                    
                    console.log("[App] Submitting loan request...");
                    await apiService.submitLoanRequest(loan);
                    alert("🚀 SUBMISSION SUCCESSFUL!\n\nYour loan request has been sent for appraisal. Track your status in the 'Active Records' section.");
                    
                    // Trigger Production Feature: Document Processing & Notifications
                    console.log("[App] Triggering document processing...");
                    try {
                      await apiService.processBorrowerSubmission(currentUser, loan);
                    } catch (procErr: any) {
                      console.error("Document processing failed", procErr);
                    }
                  } catch (err: any) {
                    console.error("Loan submission failed", err);
                    alert(`Submission Failed: ${err.message || 'Unknown error'}. Please check your internet connection.`);
                  } finally {
                    setIsSubmittingLoan(false);
                  }
                }} 
              />
           </div>
        </div>
      )}
      <CurrencyConverter />
      
      <ChatWindow 
        currentUser={currentUser}
        recipient={chatRecipient}
        onClose={() => setChatRecipient(null)}
      />

      <NotificationCenter 
        notifications={notifications}
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
    </Layout>
  );
};

export default App;