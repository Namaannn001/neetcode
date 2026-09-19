import { create } from "zustand";
import {
  User as FirebaseUser,
  onIdTokenChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "user";
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  setInitialized: (value: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  initialized: false,


  
  setInitialized: (value: boolean) => set({ initialized: value }),
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);

      set({
        user: null,
        firebaseUser: null,
        token: null,
        isAuthenticated: false,
        initialized: true,
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Firebase persists its session in the browser. Restore the corresponding
// backend user before marking authentication as initialized so protected pages
// cannot redirect during the refresh-time loading window.
onIdTokenChanged(auth, async (firebaseUser) => {
  // User logged out
  if (!firebaseUser) {
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      token: null,
      isAuthenticated: false,
      initialized: true,
      isLoading: false,
    });
    return;
  }

  // Block unverified users
  if (!firebaseUser.emailVerified) {
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      token: null,
      isAuthenticated: false,
      initialized: true,
      isLoading: false,
    });
    return;
  }

  try {
    const token = await firebaseUser.getIdToken();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      throw new Error('Unable to restore the application session');
    }

    const { user } = await response.json();

    // Ignore a stale response if the user signed out or switched accounts.
    if (auth.currentUser?.uid !== firebaseUser.uid) return;

    useAuthStore.setState({
      user,
      firebaseUser,
      token,
      isAuthenticated: true,
      initialized: true,
      isLoading: false,
    });

  } catch (err) {
    console.error("Auth state sync failed:", err);
    if (auth.currentUser?.uid !== firebaseUser.uid) return;

    // Firebase has still authenticated this user. Keep the session active so a
    // temporary backend outage does not log them out on refresh.
    useAuthStore.setState({
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email || undefined,
        role: 'user',
      },
      firebaseUser,
      token: await firebaseUser.getIdToken(),
      isAuthenticated: true,
      initialized: true,
      isLoading: false,
    });
  }
});
