"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Venue, Session } from "@/types";
import { NowPlaying } from "@/components/NowPlaying";
import { QueueList } from "@/components/QueueList";
import { SearchBar } from "@/components/SearchBar";
import { Toaster } from "@/components/ui/sonner";

type PageProps = { params: Promise<{ slug: string }> };

export default function BarPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      const venueSnap = await getDocs(query(collection(db, "venues"), where("slug", "==", slug), limit(1)));
      if (venueSnap.empty) { setLoading(false); return; }
      const venueDoc = venueSnap.docs[0];
      setVenue({ id: venueDoc.id, ...venueDoc.data() } as Venue);
      const sessionSnap = await getDocs(
        query(collection(db, "sessions"), where("venueId", "==", venueDoc.id), where("isActive", "==", true), limit(1))
      );
      if (!sessionSnap.empty) {
        setSession({ id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() } as Session);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

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
        <p className="text-xl text-muted-foreground">Bar introuvable.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="space-y-4">
          <p className="text-7xl">🌙</p>
          <p className="text-3xl font-black">{venue.name}</p>
          <p className="text-xl text-muted-foreground">Pas de session active ce soir.</p>
          <p className="text-base text-muted-foreground">Reviens plus tard !</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center py-2">
        <p className="text-4xl mb-2">🎧</p>
        <h1 className="text-3xl font-black">{venue.name}</h1>
        <p className="text-base text-muted-foreground mt-1">Demande ta musique au DJ</p>
      </div>

      <NowPlaying venueId={venue.id} />
      <SearchBar venueId={venue.id} sessionId={session.id} />
      <QueueList venueId={venue.id} sessionId={session.id} />
      <Toaster />
    </main>
  );
}
