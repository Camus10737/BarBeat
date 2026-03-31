"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QueueItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

type NowPlayingProps = { venueId: string };

export function NowPlaying({ venueId }: NowPlayingProps) {
  const [track, setTrack] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "queueItems"),
      where("venueId", "==", venueId),
      where("status", "==", "playing")
    );
    return onSnapshot(q, (snap) => {
      setTrack(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as QueueItem));
      setLoading(false);
    });
  }, [venueId]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-3xl mb-2">🎵</p>
        <p className="text-lg text-muted-foreground">Aucun morceau en cours</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse inline-block" />
        EN COURS
      </p>
      <div className="flex items-center gap-4">
        {track.coverUrl && (
          <Image src={track.coverUrl} alt={track.title} width={80} height={80} className="rounded-xl shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xl font-black truncate">{track.title}</p>
          <p className="text-base text-muted-foreground truncate">{track.artist}</p>
        </div>
      </div>
    </div>
  );
}
