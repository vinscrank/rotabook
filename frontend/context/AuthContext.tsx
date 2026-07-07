"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

async function loadProfileWithRetry(uid: string): Promise<UserProfile | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const data = await fetchProfile(uid);
    if (data) return data;
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setProfileError(null);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const data = await loadProfileWithRetry(auth.currentUser.uid);
      setProfile(data);
      if (!data) {
        setProfileError(
          "Account profile not found. Create the users document in Firestore or register a new account."
        );
      }
      return data;
    } catch {
      setProfileError("Could not load your profile. Check your connection and try again.");
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfileError(null);

      if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const data = await loadProfileWithRetry(firebaseUser.uid);
        setProfile(data);
        if (!data) {
          setProfileError(
            "Account profile not found. Create the users document in Firestore or register a new account."
          );
        }
      } catch {
        setProfile(null);
        setProfileError("Could not load your profile. Check your connection and try again.");
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      profileError,
      signIn,
      signUp,
      logout,
      refreshProfile,
    }),
    [user, profile, loading, profileLoading, profileError, signIn, signUp, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
