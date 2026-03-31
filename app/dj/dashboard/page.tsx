"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Session, Venue } from "@/types";
import { SessionControl } from "@/components/SessionControl";
import { DJQueueList } from "@/components/DJQueueList";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { LogOut } from "lucide-react";

export default function DJDashboardPage() {
  const { user, signOut } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const venueSnap = await getDocs(
        query(collection(db, "venues"), where("djUserId", "==", user!.uid), limit(1))
      );
      const snap = venueSnap.empty
        ? await getDocs(query(collection(db, "venues"), limit(1)))
        : venueSnap;
      if (snap.empty) { setLoading(false); return; }
      const venueDoc = snap.docs[0];
      const venueData = { id: venueDoc.id, ...venueDoc.data() } as Venue;
      setVenue(venueData);
      const sessionSnap = await getDocs(
        query(collection(db, "sessions"), where("venueId", "==", venueDoc.id), where("isActive", "==", true), limit(1))
      );
      if (!sessionSnap.empty) {
        const sessionDoc = sessionSnap.docs[0];
        setSession({ id: sessionDoc.id, ...sessionDoc.data() } as Session);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-xl text-muted-foreground">Aucun bar associé à ce compte.</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{venue.name}</h1>
          <p className="text-base text-muted-foreground">Dashboard DJ</p>
        </div>
        <Button variant="ghost" size="lg" onClick={signOut} className="text-base gap-2">
          <LogOut className="w-5 h-5" />
          Déco
        </Button>
      </div>

      {/* Session */}
      <SessionControl venueId={venue.id} session={session} onSessionChange={setSession} />

      {session ? (
        <>
          {/* File d'attente */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">🎵 File d&apos;attente</h2>
            <DJQueueList venueId={venue.id} sessionId={session.id} />
          </section>

          {/* QR Code */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">📱 QR Code</h2>
            <div className="bg-card border rounded-2xl p-6">
              <QRCodeDisplay slug={venue.slug} />
            </div>
          </section>
        </>
      ) : (
        <div className="bg-card border rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">🌙</p>
          <p className="text-xl font-semibold">Aucune session active</p>
          <p className="text-base text-muted-foreground">Démarre une session pour recevoir des demandes</p>
        </div>
      )}

      <Toaster />
    </main>
  );
}
