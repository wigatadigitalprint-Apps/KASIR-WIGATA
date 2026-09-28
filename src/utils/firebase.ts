import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { ProductItem, Transaction } from '../types';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with Database ID from config
export const db: Firestore = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  },
  config.firestoreDatabaseId
);

// Connection test as required by skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or syncing locally.');
    }
    return false;
  }
}

// Auth operations
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
};

export const logoutGoogle = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Google Sign Out Error:', error);
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore sync for Transactions
export const subscribeToTransactions = (
  callback: (transactions: Transaction[]) => void
) => {
  const transCol = collection(db, 'transactions');
  return onSnapshot(
    transCol,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Transaction);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
      callback(list);
    },
    (err) => {
      console.warn('Transactions snapshot error:', err);
    }
  );
};

export const saveTransactionToCloud = async (transaction: Transaction, user?: User | null) => {
  try {
    const cleanTrans = {
      ...transaction,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'Admin',
    };
    await setDoc(doc(db, 'transactions', transaction.id), cleanTrans, { merge: true });
    return true;
  } catch (error) {
    console.error('Save transaction error:', error);
    return false;
  }
};

export const deleteTransactionFromCloud = async (transactionId: string) => {
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
    return true;
  } catch (error) {
    console.error('Delete transaction error:', error);
    return false;
  }
};

// Firestore sync for Products
export const subscribeToProducts = (
  callback: (products: ProductItem[]) => void
) => {
  const prodCol = collection(db, 'products');
  return onSnapshot(
    prodCol,
    (snapshot) => {
      if (snapshot.empty) return;
      const list: ProductItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ProductItem);
      });
      callback(list);
    },
    (err) => {
      console.warn('Products snapshot error:', err);
    }
  );
};

export const saveProductToCloud = async (product: ProductItem, user?: User | null) => {
  try {
    const data = {
      ...product,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'Admin',
    };
    await setDoc(doc(db, 'products', product.id), data, { merge: true });
    return true;
  } catch (error) {
    console.error('Save product error:', error);
    return false;
  }
};

export const saveAllProductsToCloud = async (products: ProductItem[], user?: User | null) => {
  try {
    for (const prod of products) {
      await saveProductToCloud(prod, user);
    }
    return true;
  } catch (error) {
    console.error('Batch save products error:', error);
    return false;
  }
};

export const deleteProductFromCloud = async (productId: string) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Delete product error:', error);
    return false;
  }
};
