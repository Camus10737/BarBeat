"use client";

import { useState } from "react";
import {
  collection, addDoc, query, where, getDocs,
  updateDoc, increment, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSpotifySearch, SpotifyTrack } from "@/hooks/useSpotifySearch";
import { getFingerprint } from "@/lib/fingerprint";
import { checkRateLimit } from "@/lib/rateLimit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search } from "lucide-react";
import Image from "next/image";

type SearchBarProps = { venueId: string; sessionId: string };

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SearchBar({ venueId, sessionId }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { results, loading, error } = useSpotifySearch(inputValue);

  async function handleRequest(track: SpotifyTrack) {
    setSubmitting(track.id);
    try {
      const fingerprint = await getFingerprint();
      const rateCheck = await checkRateLimit(fingerprint, venueId);
      if (!rateCheck.allowed) {
        const minutes = Math.ceil(rateCheck.remainingMs / 60000);
        toast.error(`Attends encore ${minutes} minute${minutes > 1 ? "s" : ""} avant de redemander.`);
        return;
      }
      const dupSnap = await getDocs(
        query(collection(db, "queueItems"),
          where("venueId", "==", venueId),
          where("sessionId", "==", sessionId),
          where("spotifyTrackId", "==", track.id),
          where("status", "==", "pending"))
      );
      if (!dupSnap.empty) {
        await updateDoc(dupSnap.docs[0].ref, { requestCount: increment(1) });
        toast.success("Titre déjà en file — ta demande a été comptée !");
        setInputValue("");
        return;
      }
      await addDoc(collection(db, "queueItems"), {
        venueId, sessionId,
        spotifyTrackId: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        duration: track.duration,
        requestedBy: fingerprint,
        requestCount: 1,
        status: "pending",
        requestedAt: Timestamp.now(),
      });
      toast.success("🎵 Ta demande a été envoyée au DJ !");
      setInputValue("");
    } catch {
      toast.error("Une erreur est survenue. Réessaie.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🔍 Demander un titre</h2>

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Recherche un titre ou un artiste..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-12 h-14 text-lg"
        />
      </div>

      {/* Loading */}
      {loading && inputValue.trim().length >= 3 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-base text-destructive font-medium">{error}</p>}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((track) => (
            <div key={track.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-4 mb-4">
                {track.coverUrl ? (
                  <Image src={track.coverUrl} alt={track.title} width={64} height={64} className="rounded-xl shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0 text-2xl">🎵</div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-lg font-bold truncate">{track.title}</p>
                  <p className="text-base text-muted-foreground truncate">{track.artist}</p>
                  <p className="text-sm text-muted-foreground">{formatDuration(track.duration)}</p>
                </div>
              </div>
              <Button
                className="w-full h-12 text-base font-bold"
                onClick={() => handleRequest(track)}
                disabled={submitting === track.id}
              >
                {submitting === track.id ? "Envoi en cours..." : "🎵 Demander au DJ"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
