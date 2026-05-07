"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Venue } from "@/types";
import { VenueStats } from "@/components/VenueStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { signOut } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState({ totalBars: 0, totalRequests: 0, totalSessions: 0 });

  useEffect(() => {
    async function load() {
      const [venuesSnap, requestsSnap, sessionsSnap] = await Promise.all([
        getDocs(collection(db, "venues")),
        getDocs(collection(db, "queueItems")),
        getDocs(collection(db, "sessions")),
      ]);
      setVenues(venuesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
      setGlobalStats({
        totalBars: venuesSnap.size,
        totalRequests: requestsSnap.size,
        totalSessions: sessionsSnap.size,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">BarBeat Admin</h1>
          <p className="text-base text-muted-foreground">Gestion de la plateforme</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/venues/new">
            <Button size="lg" className="gap-2 text-base">
              <Plus className="w-5 h-5" /> Créer un bar
            </Button>
          </Link>
          <Button variant="ghost" size="lg" onClick={signOut} className="gap-2">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Bars", value: globalStats.totalBars },
          { label: "Demandes total", value: globalStats.totalRequests },
          { label: "Sessions total", value: globalStats.totalSessions },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <p className="text-3xl font-black">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Liste des bars */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Bars</h2>
        {venues.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">Aucun bar encore. Crée le premier !</p>
        )}
        {venues.map((venue) => (
          <div key={venue.id} className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {venue.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={venue.logoUrl} alt={venue.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                {!venue.logoUrl && venue.primaryColor && (
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: venue.primaryColor }} />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-lg truncate">{venue.name}</p>
                  <p className="text-sm text-muted-foreground">/{venue.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={venue.isActive ? "default" : "secondary"}>
                  {venue.isActive ? "Actif" : "Inactif"}
                </Badge>
                <Badge variant="outline">{venue.djUserIds?.length ?? 0} DJ{(venue.djUserIds?.length ?? 0) > 1 ? "s" : ""}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedVenue(expandedVenue === venue.id ? null : venue.id)}
                >
                  {expandedVenue === venue.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {expandedVenue === venue.id && (
              <div className="border-t p-4">
                <VenueStats venueId={venue.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
