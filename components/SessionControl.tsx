"use client";

import { useState } from "react";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Session } from "@/types";
import { Button } from "@/components/ui/button";

type SessionControlProps = {
  venueId: string;
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
};

export function SessionControl({ venueId, session, onSessionChange }: SessionControlProps) {
  const [loading, setLoading] = useState(false);

  async function startSession() {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        venueId,
        startedAt: Timestamp.now(),
        endedAt: null,
        isActive: true,
      });
      onSessionChange({ id: docRef.id, venueId, startedAt: Timestamp.now(), endedAt: null, isActive: true });
    } finally {
      setLoading(false);
    }
  }

  async function stopSession() {
    if (!session) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "sessions", session.id), { isActive: false, endedAt: Timestamp.now() });
      onSessionChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${session ? "bg-primary/10 border-primary/30" : "bg-card"}`}>
      <div className="space-y-1">
        <p className="text-lg font-bold">Session</p>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${session ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-base text-muted-foreground">{session ? "En cours" : "Inactive"}</span>
        </div>
      </div>
      {session ? (
        <Button variant="destructive" size="lg" onClick={stopSession} disabled={loading} className="text-base font-bold h-12 px-6">
          {loading ? "..." : "Terminer"}
        </Button>
      ) : (
        <Button size="lg" onClick={startSession} disabled={loading} className="text-base font-bold h-12 px-6">
          {loading ? "..." : "▶ Démarrer"}
        </Button>
      )}
    </div>
  );
}
