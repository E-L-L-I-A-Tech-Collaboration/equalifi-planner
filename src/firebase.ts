import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Support both embedded configuration and standard Vite environment variables for export portability
const resolvedConfig = {
  apiKey: firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;

const app = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);
export const auth = getAuth(app);

// Use the dedicated databaseId if provided
export const db = firestoreDatabaseId 
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Record user profile in Firestore
    if (result.user) {
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  if (result.user) {
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email || '',
      displayName: name || result.user.displayName || '',
      photoURL: result.user.photoURL || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

/**
 * Permanently delete the signed-in user's account and their cloud data
 * (users/{uid} profile doc and users/{uid}/plans/active plan doc).
 * Firebase requires a recent login for account deletion, so the user is
 * re-authenticated first: email/password accounts pass their password in;
 * Google accounts re-authenticate via popup.
 * NOTE: this does NOT cancel any Google Play subscription — billing is
 * managed by the user in Google Play, and the UI says so before confirming.
 */
export async function deleteAccount(password?: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No signed-in user to delete.');
  }

  const providers = user.providerData.map((p) => p.providerId);
  if (providers.includes('password')) {
    if (!password || !user.email) {
      throw new Error('Enter your password to delete this account.');
    }
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password)
    );
  } else if (providers.includes('google.com')) {
    await reauthenticateWithPopup(user, googleProvider);
  }

  // Delete cloud data first so nothing is orphaned if account deletion fails.
  await deleteDoc(doc(db, 'users', user.uid, 'plans', 'active'));
  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
}

export async function savePlanToCloud(userId: string, planData: any) {
  if (!userId) return;
  const planRef = doc(db, 'users', userId, 'plans', 'active');
  await setDoc(planRef, {
    ...planData,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function loadPlanFromCloud(userId: string) {
  if (!userId) return null;
  const planRef = doc(db, 'users', userId, 'plans', 'active');
  const snap = await getDoc(planRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

export { onAuthStateChanged };
export type { User };
