
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  getDocFromServer,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  User, 
  Loan, 
  Transaction, 
  AppNotification, 
  AuditLog, 
  Location, 
  TravelMode, 
  MobileOperator, 
  OutgoingEmail, 
  StatusUpdate, 
  DashboardStats, 
  DocumentMetadata 
} from './types';

// Error handling helper as per guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class FirestoreBackend {
  private usersCol = 'users';
  private loansCol = 'loans';
  private transactionsCol = 'transactions';
  private auditLogsCol = 'auditLogs';
  private documentsCol = 'documents';
  private emailsCol = 'outgoingEmails';
  private notificationsCol = 'notifications';
  private messagesCol = 'messages';
  private vaultDoc = 'system/vault';

  // ... (previous methods)

  async sendMessage(msg: Omit<Message, 'id' | 'timestamp' | 'read'>) {
    const message: Message = {
      ...msg,
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    try {
      await setDoc(doc(db, this.messagesCol, message.id), message);
      
      // Create notification for recipient
      await this.createNotification(
        message.recipientId, 
        `New message from ${message.senderName}`,
        message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        'MESSAGE'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.messagesCol);
    }
  }

  subscribeToMessages(userId: string, otherId: string, callback: (messages: Message[]) => void) {
    // Queries messages where current user is either sender or recipient
    const q = query(
      collection(db, this.messagesCol),
      where('recipientId', 'in', [userId, otherId]),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(d => d.data() as Message);
      // Filter client-side to get only thread between these two specific users (Firestore 'in' is limited)
      const thread = allMsgs.filter(m => 
        (m.senderId === userId && m.recipientId === otherId) || 
        (m.senderId === otherId && m.recipientId === userId)
      );
      callback(thread);
    }, (error) => handleFirestoreError(error, OperationType.LIST, this.messagesCol));
  }

  subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    const q = query(
      collection(db, this.notificationsCol),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as AppNotification));
    }, (error) => handleFirestoreError(error, OperationType.LIST, this.notificationsCol));
  }

  async markAllNotificationsRead(userId: string) {
    try {
      const q = query(collection(db, this.notificationsCol), where('userId', '==', userId), where('read', '==', false));
      const snap = await getDocs(q);
      const promises = snap.docs.map(d => updateDoc(doc(db, this.notificationsCol, d.id), { read: true }));
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, this.notificationsCol);
    }
  }

  async testConnection(attempts = 0) {
    try {
      console.log(`[Backend] Testing connection to Firestore (Attempt ${attempts + 1})...`);
      // Use a timeout to avoid hanging indefinitely if the network is flaky at startup
      const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
      
      await Promise.race([testPromise, timeoutPromise]);
      console.log("[Backend] Firestore connection verified.");
    } catch (error: any) {
      if (error.message === 'timeout' || error.message?.includes('the client is offline')) {
        if (attempts < 3) {
          console.warn(`[Backend] Firestore offline/timed out. Retrying in 2s... (${attempts + 1}/3)`);
          setTimeout(() => this.testConnection(attempts + 1), 2000);
        } else {
          console.error("CRITICAL: Firestore is offline. This usually means the Project ID or API Key in firebase-applet-config.json is incorrect, or the Firestore Database instance is not yet ready.");
          console.error("Technical Error:", error.message);
        }
      } else if (error.message?.includes('permission-denied')) {
        console.log("[Backend] Firestore reachable (Server returned Permission Denied - this confirms connection).");
      } else {
        console.error("[Backend] Connection test failed with unexpected error:", error.message);
      }
    }
  }

  async createAuditLog(userId: string, userName: string, action: string, category: AuditLog['category'], details: string, severity: AuditLog['severity'] = 'LOW') {
    const log: AuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId,
      userName,
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
      severity
    };
    try {
      await setDoc(doc(db, this.auditLogsCol, log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.auditLogsCol}/${log.id}`);
    }
  }

  async logEmail(email: OutgoingEmail) {
    try {
      const id = `EMAIL-${Date.now()}`;
      await setDoc(doc(db, this.emailsCol, id), { ...email, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.emailsCol);
    }
  }

  async createNotification(userId: string, title: string, message: string, type: AppNotification['type'] = 'INFO') {
    const notification: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, this.notificationsCol, notification.id), notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.notificationsCol}/${notification.id}`);
    }
  }

  async getNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCol), 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as AppNotification);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.notificationsCol);
      return [];
    }
  }

  async markNotificationRead(id: string) {
    try {
      await updateDoc(doc(db, this.notificationsCol, id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.notificationsCol}/${id}`);
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.usersCol, userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${this.usersCol}/${userId}`);
      return null;
    }
  }

  async register(userData: User): Promise<{ status: number; user: User }> {
    const userToSave = { 
      ...userData, 
      walletBalance: userData.walletBalance ?? 0, 
      trustScore: 50,
      joinedAt: userData.joinedAt || new Date().toISOString()
    };
    try {
      await setDoc(doc(db, this.usersCol, userToSave.id), userToSave);
      await this.createAuditLog(userToSave.id, userToSave.name, 'USER_REGISTERED', 'IDENTITY', `Permanent record created for ${userToSave.name}`, 'MEDIUM');
      return { status: 200, user: userToSave };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.usersCol}/${userToSave.id}`);
      throw error;
    }
  }

  async submitLoan(loan: Loan): Promise<{ status: number; loan: Loan }> {
    const history: StatusUpdate[] = [{
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      message: 'Initial request logged. Moving to physical appraisal queue.'
    }];
    const loanWithHistory = { ...loan, statusHistory: history };
    try {
      await setDoc(doc(db, this.loansCol, loan.id), loanWithHistory);
      await this.createAuditLog(loan.userId, loan.userName, 'LOAN_REQUEST', 'FINANCE', `Loan ${loan.id} filed for record. Amount: ${loan.principal}.`, 'MEDIUM');
      
      // Notify admins
      const adminQ = query(collection(db, this.usersCol), where('role', '==', 'ADMIN'));
      const adminSnap = await getDocs(adminQ);
      for (const admin of adminSnap.docs) {
        await this.createNotification(
          admin.id,
          'New Loan Request',
          `${loan.userName} submitted a request for ${loan.principal} ZMW`,
          'LOAN_UPDATE'
        );
      }
      
      return { status: 201, loan: loanWithHistory };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.loansCol}/${loan.id}`);
      throw error;
    }
  }

  // Real-time Subscriptions
  subscribeToStats(callback: (stats: DashboardStats) => void) {
    const qLoans = query(collection(db, this.loansCol), orderBy('createdAt', 'desc'));
    const qUsers = collection(db, this.usersCol);
    const qTxns = query(collection(db, this.transactionsCol), orderBy('timestamp', 'desc'));
    const qLogs = query(collection(db, this.auditLogsCol), orderBy('timestamp', 'desc'), limit(50));
    
    // We'll use a combined listener strategy or individual ones. For simplicity and reliability in the Dashboard:
    return onSnapshot(qLoans, async (snapshot) => {
      const stats = await this.getDashboardStats();
      callback(stats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'loans_subscription'));
  }

  subscribeToUserLoans(userId: string, callback: (loans: Loan[]) => void) {
    const q = query(
      collection(db, this.loansCol),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as Loan));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `user_loans_${userId}`));
  }

  async updateLoanStatus(loanId: string, status: Loan['status']): Promise<{ status: number; loan?: Loan }> {
    try {
      const loanRef = doc(db, this.loansCol, loanId);
      const loanDoc = await getDoc(loanRef);
      if (loanDoc.exists()) {
        const loan = loanDoc.data() as Loan;
        const history = loan.statusHistory || [];
        history.push({
          status: status,
          timestamp: new Date().toISOString(),
          message: `Status updated to ${status} by Management.`
        });
        await updateDoc(loanRef, { status, statusHistory: history });
        
        // Notify user about status change
        await this.createNotification(
          loan.userId,
          `Loan Status Updated: ${status}`,
          `Your loan ${loanId} is now ${status}. Check status history for details.`,
          'LOAN_UPDATE'
        );

        return { status: 200, loan: { ...loan, status, statusHistory: history } };
      }
      return { status: 404 };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.loansCol}/${loanId}`);
      return { status: 500 };
    }
  }

  async getVaultBalance(): Promise<number> {
    try {
      const vaultDoc = await getDoc(doc(db, 'system', 'vault'));
      return vaultDoc.exists() ? vaultDoc.data().balance : 750000;
    } catch (error) {
      return 750000;
    }
  }

  async adjustVault(amount: number, reason: string): Promise<{ status: number }> {
    try {
      const current = await this.getVaultBalance();
      await setDoc(doc(db, 'system', 'vault'), { balance: current + amount });
      await this.createAuditLog('ADMIN', 'SYSTEM', 'VAULT_ADJUST', 'FINANCE', `Vault adjusted by ${amount}. Reason: ${reason}`, 'HIGH');
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/vault');
      return { status: 500 };
    }
  }

  async disburse(loanId: string): Promise<{ status: number; transactionId?: string }> {
    try {
      const loanRef = doc(db, this.loansCol, loanId);
      const loanDoc = await getDoc(loanRef);
      if (!loanDoc.exists()) return { status: 404 };
      const loan = loanDoc.data() as Loan;

      const userRef = doc(db, this.usersCol, loan.userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return { status: 404 };
      const user = userDoc.data() as User;

      const transactionId = `TXN-${Date.now()}`;
      const now = new Date().toISOString();

      await updateDoc(loanRef, { status: 'DISBURSED', disbursedAt: now });
      await updateDoc(userRef, { walletBalance: (user.walletBalance || 0) + loan.principal });
      await this.adjustVault(-loan.principal, `Disbursement for ${loanId}`);

      const txn: Transaction = {
        id: transactionId,
        userId: user.id,
        type: 'DISBURSEMENT',
        amount: loan.principal,
        timestamp: now,
        status: 'COMPLETED'
      };
      await setDoc(doc(db, this.transactionsCol, transactionId), txn);

      await this.createAuditLog(user.id, user.name, 'LOAN_DISBURSED', 'FINANCE', `Physical payout completed for ${loanId}.`, 'HIGH');
      return { status: 200, transactionId };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'disburse_operation');
      return { status: 500 };
    }
  }

  async repay(loanId: string, userId: string, amount: number): Promise<{ status: number }> {
    try {
      const loanRef = doc(db, this.loansCol, loanId);
      const userRef = doc(db, this.usersCol, userId);
      const loanDoc = await getDoc(loanRef);
      const userDoc = await getDoc(userRef);
      if (!loanDoc.exists() || !userDoc.exists()) return { status: 404 };

      const loan = loanDoc.data() as Loan;
      const user = userDoc.data() as User;
      const now = new Date().toISOString();

      const history = loan.statusHistory || [];
      history.push({
        status: 'REPAID',
        timestamp: now,
        message: 'Loan successfully settled in full.'
      });

      await updateDoc(loanRef, { status: 'REPAID', statusHistory: history });
      await updateDoc(userRef, { walletBalance: Math.max(0, (user.walletBalance || 0) - amount) });
      await this.adjustVault(amount, `Repayment for ${loanId}`);

      const txn: Transaction = {
        id: `TXN-${Date.now()}`,
        userId: user.id,
        type: 'REPAYMENT',
        amount: amount,
        timestamp: now,
        status: 'COMPLETED'
      };
      await setDoc(doc(db, this.transactionsCol, txn.id), txn);

      await this.createAuditLog(userId, user.name, 'LOAN_REPAID', 'FINANCE', `Repayment received for ${loanId}.`, 'MEDIUM');
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'repay_operation');
      return { status: 500 };
    }
  }

  async simulateLoan(data: { name: string, principal: number, disbursedDate: string, dueDate: string }): Promise<{ status: number }> {
    const simLoan: Loan = {
      id: `SIM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId: 'SIM-USER',
      userName: data.name,
      principal: data.principal,
      purpose: 'Simulation Modeling',
      tenure: '14 Days',
      repaymentMethod: 'CASH',
      status: 'APPROVED',
      createdAt: data.disbursedDate,
      dueDate: data.dueDate,
      collateralType: 'PHONE',
      collateralDescription: 'Simulated Asset',
      hasAgreedToOwnership: true,
      hasAgreedToVerification: true,
      statusHistory: [{
        status: 'APPROVED',
        timestamp: data.disbursedDate,
        message: 'Scenario model generated.'
      }]
    };
    try {
      await setDoc(doc(db, this.loansCol, simLoan.id), simLoan);
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.loansCol}/${simLoan.id}`);
      return { status: 500 };
    }
  }

  async updateLocation(userId: string, location: Location): Promise<{ status: number }> {
    try {
      await updateDoc(doc(db, this.usersCol, userId), { currentLocation: location });
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.usersCol}/${userId}`);
      return { status: 500 };
    }
  }

  async setTravelStatus(loanId: string, status: boolean, mode?: TravelMode, eta?: string): Promise<{ status: number }> {
    try {
      const loanRef = doc(db, this.loansCol, loanId);
      await updateDoc(loanRef, { 
        isTravelingToSite: status,
        travelMode: mode || null,
        estimatedArrival: eta || null
      });
      await this.createAuditLog('SYSTEM', 'SYSTEM', 'TRAVEL_UPDATE', 'SYSTEM', `Arrival status for ${loanId}: ${status}`, 'LOW');
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.loansCol}/${loanId}`);
      return { status: 500 };
    }
  }

  async withdrawToMoMo(userId: string, amount: number, operator: MobileOperator): Promise<{ status: number }> {
    try {
      const userRef = doc(db, this.usersCol, userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return { status: 404 };
      const user = userDoc.data() as User;
      if ((user.walletBalance || 0) < amount) return { status: 400 };
      
      await updateDoc(userRef, { walletBalance: (user.walletBalance || 0) - amount });
      await this.adjustVault(amount, `Withdrawal to ${operator}`);
      await this.createAuditLog(userId, user.name, 'WITHDRAWAL_MOMO', 'FINANCE', `Withdrawal to ${operator}`, 'MEDIUM');
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'withdraw_momo');
      return { status: 500 };
    }
  }

  async depositFromMoMo(userId: string, amount: number): Promise<{ status: number }> {
    try {
      const userRef = doc(db, this.usersCol, userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return { status: 404 };
      const user = userDoc.data() as User;

      await updateDoc(userRef, { walletBalance: (user.walletBalance || 0) + amount });
      await this.adjustVault(-amount, `Mobile Money Deposit`);
      await this.createAuditLog(userId, user.name, 'DEPOSIT_MOMO', 'FINANCE', `Mobile Money Deposit`, 'MEDIUM');
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'deposit_momo');
      return { status: 500 };
    }
  }

  async saveDocuments(docs: DocumentMetadata[]) {
    try {
      for (const docMeta of docs) {
        await setDoc(doc(db, this.documentsCol, docMeta.id), docMeta);
      }
      return { status: 200 };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, this.documentsCol);
      return { status: 500 };
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, this.usersCol), where('email', '==', email), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `find_user_by_email_${email}`);
      return null;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const loansSnap = await getDocs(query(collection(db, this.loansCol), orderBy('createdAt', 'desc')));
      const usersSnap = await getDocs(collection(db, this.usersCol));
      const txnsSnap = await getDocs(query(collection(db, this.transactionsCol), orderBy('timestamp', 'desc')));
      const logsSnap = await getDocs(query(collection(db, this.auditLogsCol), orderBy('timestamp', 'desc'), limit(50)));
      const emailsSnap = await getDocs(query(collection(db, this.emailsCol), orderBy('timestamp', 'desc')));
      const docsSnap = await getDocs(query(collection(db, this.documentsCol), orderBy('createdAt', 'desc')));
      const vaultBalance = await this.getVaultBalance();

      return {
        vaultBalance,
        loans: loansSnap.docs.map(d => d.data() as Loan),
        users: usersSnap.docs.map(d => d.data() as User),
        transactions: txnsSnap.docs.map(d => d.data() as Transaction),
        auditLogs: logsSnap.docs.map(d => d.data() as AuditLog),
        outgoingEmails: emailsSnap.docs.map(d => d.data() as OutgoingEmail),
        documents: docsSnap.docs.map(d => d.data() as DocumentMetadata)
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'dashboard_stats');
      throw error;
    }
  }
}

export const backend = new FirestoreBackend();
backend.testConnection();
