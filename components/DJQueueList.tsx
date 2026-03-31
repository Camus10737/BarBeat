"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QueueItem } from "@/types";
import { QueueItemCard } from "@/components/QueueItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { playNotificationSound } from "@/lib/notification";

type DJQueueListProps = {
  venueId: string;
  sessionId: string;
};

export function DJQueueList({ venueId, sessionId }: DJQueueListProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "queueItems"),
      where("venueId", "==", venueId),
      where("sessionId", "==", sessionId),
      where("status", "in", ["pending", "playing"]),
      orderBy("requestedAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const newItems = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as QueueItem));

      // Jouer un bip si une nouvelle demande arrive
      if (prevCountRef.current !== null && newItems.length > prevCountRef.current) {
        playNotificationSound();
      }
      prevCountRef.current = newItems.length;

      setItems(newItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [venueId, sessionId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border">
            <Skeleton className="w-12 h-12 rounded-md shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        Aucune demande pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <QueueItemCard key={item.id} item={item} venueId={venueId} />
      ))}
    </div>
  );
}
