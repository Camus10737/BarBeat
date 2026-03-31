"use client";

import { useState } from "react";
import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QueueItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

type QueueItemCardProps = {
  item: QueueItem;
  venueId: string;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function QueueItemCard({ item, venueId }: QueueItemCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPlaying = item.status === "playing";

  async function handlePlay() {
    setLoading("play");
    try {
      const playingSnap = await getDocs(
        query(collection(db, "queueItems"), where("venueId", "==", venueId), where("status", "==", "playing"))
      );
      for (const d of playingSnap.docs) await updateDoc(d.ref, { status: "played" });
      await updateDoc(doc(db, "queueItems", item.id), { status: "playing" });
    } finally { setLoading(null); }
  }

  async function handleSkip() {
    setLoading("skip");
    try {
      await updateDoc(doc(db, "queueItems", item.id), { status: "played" });
    } finally { setLoading(null); }
  }

  async function handleDelete() {
    setLoading("delete");
    try {
      await updateDoc(doc(db, "queueItems", item.id), { status: "removed" });
    } finally { setLoading(null); setConfirmDelete(false); }
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-colors ${isPlaying ? "bg-primary/10 border-primary/40" : "bg-card"}`}>
        <div className="flex items-center gap-4">
          {item.coverUrl && (
            <Image src={item.coverUrl} alt={item.title} width={64} height={64} className="rounded-xl shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isPlaying && <Badge className="text-sm px-2 py-0.5">🎵 En cours</Badge>}
              {item.requestCount > 1 && <Badge variant="secondary" className="text-sm px-2 py-0.5">🔥 x{item.requestCount}</Badge>}
            </div>
            <p className="text-lg font-bold truncate">{item.title}</p>
            <p className="text-base text-muted-foreground truncate">{item.artist}</p>
            <p className="text-sm text-muted-foreground">{formatDuration(item.duration)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {!isPlaying && (
            <Button size="lg" className="flex-1 text-base font-bold h-12" onClick={handlePlay} disabled={loading === "play"}>
              {loading === "play" ? "..." : "✅ Jouer"}
            </Button>
          )}
          <Button size="lg" variant="secondary" className="flex-1 text-base font-bold h-12" onClick={handleSkip} disabled={loading === "skip"}>
            {loading === "skip" ? "..." : "⏭ Skip"}
          </Button>
          <Button size="lg" variant="outline" className="flex-1 text-base font-bold h-12" onClick={() => setConfirmDelete(true)}>
            🗑
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Supprimer cette demande ?</DialogTitle>
          </DialogHeader>
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-foreground">{item.title}</span> — {item.artist}
          </p>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" size="lg" className="text-base" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" size="lg" className="text-base" onClick={handleDelete} disabled={loading === "delete"}>
              {loading === "delete" ? "..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
