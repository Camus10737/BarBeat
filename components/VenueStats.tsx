"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Stats = {
  totalSessions: number;
  totalRequests: number;
  uniqueVisitors: number;
  topSongs: { title: string; artist: string; count: number }[];
  requestsPerSession: { sessionId: string; startedAt: unknown; count: number }[];
};

type VenueStatsProps = { venueId: string };

export function VenueStats({ venueId }: VenueStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sessionsSnap, requestsSnap] = await Promise.all([
        getDocs(query(collection(db, "sessions"), where("venueId", "==", venueId))),
        getDocs(query(collection(db, "queueItems"), where("venueId", "==", venueId))),
      ]);

      const fingerprints = new Set<string>();
      const songMap: Record<string, { title: string; artist: string; count: number }> = {};
      const sessionCounts: Record<string, number> = {};

      for (const d of requestsSnap.docs) {
        const data = d.data();
        fingerprints.add(data.requestedBy);

        const key = `${data.title}|||${data.artist}`;
        if (!songMap[key]) songMap[key] = { title: data.title, artist: data.artist, count: 0 };
        songMap[key].count += data.requestCount ?? 1;

        sessionCounts[data.sessionId] = (sessionCounts[data.sessionId] ?? 0) + 1;
      }

      const topSongs = Object.values(songMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const sessionById: Record<string, unknown> = {};
      for (const d of sessionsSnap.docs) sessionById[d.id] = d.data().startedAt;

      const requestsPerSession = sessionsSnap.docs
        .map((d) => ({
          sessionId: d.id,
          startedAt: d.data().startedAt,
          count: sessionCounts[d.id] ?? 0,
        }))
        .sort((a, b) => (sessionCounts[b.sessionId] ?? 0) - (sessionCounts[a.sessionId] ?? 0))
        .slice(0, 5);

      setStats({
        totalSessions: sessionsSnap.size,
        totalRequests: requestsSnap.size,
        uniqueVisitors: fingerprints.size,
        topSongs,
        requestsPerSession,
      });
      setLoading(false);
    }
    load();
  }, [venueId]);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement des stats...</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sessions", value: stats.totalSessions },
          { label: "Demandes", value: stats.totalRequests },
          { label: "Visiteurs", value: stats.uniqueVisitors },
          { label: "Titres uniques", value: stats.topSongs.length > 0 ? Object.keys(stats.topSongs).length : 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <p className="text-3xl font-black">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Top morceaux */}
        {stats.topSongs.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top demandes</p>
            {stats.topSongs.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.artist}</p>
                </div>
                <span className="text-sm font-bold shrink-0">×{s.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Demandes par soirée */}
        {stats.requestsPerSession.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Demandes / soirée</p>
            {stats.requestsPerSession.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground truncate">Soirée {i + 1}</p>
                <span className="text-sm font-bold">{s.count} demandes</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
