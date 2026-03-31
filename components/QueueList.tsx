"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QueueItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

type QueueListProps = { venueId: string; sessionId: string };

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function QueueList({ venueId, sessionId }: QueueListProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "queueItems"),
      where("venueId", "==", venueId),
      where("sessionId", "==", sessionId),
      where("status", "==", "pending"),
      orderBy("requestedAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QueueItem)));
      setLoading(false);
    });
  }, [venueId, sessionId]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        📋 File d&apos;attente {!loading && items.length > 0 && <span className="text-muted-foreground font-normal text-lg">({items.length})</span>}
      </h2>

      {loading && (
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

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
          <p className="text-3xl">🎤</p>
          <p className="text-lg text-muted-foreground">Aucune demande pour l&apos;instant</p>
          <p className="text-base text-muted-foreground">Sois le premier !</p>
        </div>
      )}

      {!loading && items.map((item) => (
        <div key={item.id} className="rounded-2xl border bg-card p-4 flex items-center gap-4">
          {item.coverUrl && (
            <Image src={item.coverUrl} alt={item.title} width={64} height={64} className="rounded-xl shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-lg font-bold truncate">{item.title}</p>
            <p className="text-base text-muted-foreground truncate">{item.artist}</p>
            <p className="text-sm text-muted-foreground">{formatDuration(item.duration)}</p>
          </div>
          {item.requestCount > 1 && (
            <Badge variant="secondary" className="text-base px-3 py-1 shrink-0">
              🔥 x{item.requestCount}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
