import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Venue } from "@/types";

export async function isAdmin(uid: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}

export async function getOwnerVenue(uid: string): Promise<Venue | null> {
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, "venues"), where("ownerUserId", "==", uid))
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Venue;
}
