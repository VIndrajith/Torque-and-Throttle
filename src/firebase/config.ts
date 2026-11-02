export const firebaseConfig = {
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "tnt-storage",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:403377153061:web:f785de4f2ebd00f6dd8bcc",
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyCqkwl8e-W3IM7W3yHZR3lJZihA1fWMDqA",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "tnt-storage.firebaseapp.com",
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || "ai-studio-torquethrottlece-62e426e4-84a4-420f-9bf0-7653f6fe0cb4",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "tnt-storage.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "403377153061",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "",
  oAuthClientId: (import.meta as any).env?.VITE_FIREBASE_OAUTH_CLIENT_ID || "403377153061-lei54jutv2e1qekl5lu6u1s9mdtfj7fn.apps.googleusercontent.com",
  recaptchaSiteKey: (import.meta as any).env?.VITE_FIREBASE_RECAPTCHA_SITE_KEY || "",
};

export default firebaseConfig;
