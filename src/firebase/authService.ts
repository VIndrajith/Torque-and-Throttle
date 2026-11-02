import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { AdminUser } from '../types';
import { SYSTEM_ADMINS } from './adminConfig';

const SUPERADMIN_EMAILS = [
  'indrajith08102003@gmail.com',
];

/**
 * Resolves or builds an AdminUser profile from an authenticated Firebase User.
 */
export function resolveAdminFromFirebaseUser(user: FirebaseUser | null): AdminUser | null {
  if (!user || !user.email) return null;

  const email = user.email.toLowerCase().trim();

  // Check if matching superadmin
  if (SUPERADMIN_EMAILS.some((se) => se.toLowerCase() === email)) {
    return {
      id: 'superadmin-indrajith',
      uid: user.uid,
      role: 'superadmin',
      name: user.displayName || 'Indrajith (Master Admin)',
      email: user.email,
      location: 'Central Operations HQ',
      phone: user.phoneNumber || '+91 98765 43210',
    };
  }

  // Check if matches configured system admins (e.g. Sanjay Sudhakaran)
  const match = SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === email);
  if (match) {
    return {
      ...match,
      uid: user.uid,
      name: user.displayName || match.name,
      email: user.email,
    };
  }

  // Fallback for dealership corporate domain emails
  if (email.endsWith('@torquethrottle.com')) {
    return {
      id: `admin-${user.uid.slice(0, 8)}`,
      uid: user.uid,
      role: 'admin',
      name: user.displayName || 'Dealership Operations Admin',
      email: user.email,
      location: 'Central Vault HQ',
    };
  }

  return null;
}

/**
 * Initiates Google OAuth popup login for administrators.
 */
export async function loginWithGoogle(): Promise<AdminUser | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return resolveAdminFromFirebaseUser(result.user);
}

/**
 * Signs out the current administrator.
 */
export async function logoutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes.
 */
export function subscribeToAuthState(callback: (user: AdminUser | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    const admin = resolveAdminFromFirebaseUser(fbUser);
    callback(admin);
  });
}
