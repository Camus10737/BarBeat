import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; remainingMs: number };

// Bloque uniquement si le DJ a joué un son de cet utilisateur dans les 5 dernières minutes
export async function checkRateLimit(
  fingerprint: string,
  venueId: string
): Promise<RateLimitResult> {
  const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - COOLDOWN_MS);

  const q = query(
    collection(db, "queueItems"),
    where("requestedBy", "==", fingerprint),
    where("venueId", "==", venueId),
    where("playedAt", ">=", fiveMinutesAgo)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { allowed: true };
  }

  const mostRecent = snapshot.docs.reduce((latest, doc) => {
    const t = doc.data().playedAt as Timestamp;
    return t.toMillis() > latest ? t.toMillis() : latest;
  }, 0);

  const remainingMs = mostRecent + COOLDOWN_MS - Date.now();
  return { allowed: false, remainingMs };
}
