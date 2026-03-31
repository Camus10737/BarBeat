"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error("Firebase non initialisé");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
  }

  return { user, loading, signIn, signOut };
}
