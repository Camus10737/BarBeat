"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { doc, updateDoc, getDocs, addDoc, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { getOwnerVenue } from "@/lib/roles";
import { Venue } from "@/types";
import { VenueStats } from "@/components/VenueStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LogOut, Trash2 } from "lucide-react";

export default function OwnerDashboardPage() {
  const { user, signOut } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDjEmail, setNewDjEmail] = useState("");
  const [addingDj, setAddingDj] = useState(false);

  const [form, setForm] = useState({ name: "", primaryColor: "", logoUrl: "" });

  useEffect(() => {
    if (!user) return;
    getOwnerVenue(user.uid).then((v) => {
      if (v) {
        setVenue(v);
        setForm({ name: v.name, primaryColor: v.primaryColor ?? "#6366f1", logoUrl: v.logoUrl ?? "" });
      }
      setLoading(false);
    });
  }, [user]);

  async function handleSave() {
    if (!venue) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "venues", venue.id), {
        name: form.name,
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl,
      });
      setVenue((prev) => prev ? { ...prev, ...form } : prev);
      toast.success("Modifications sauvegardées !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDj() {
    if (!venue || !newDjEmail.trim()) return;
    setAddingDj(true);
    try {
      // Cherche l'utilisateur par email dans les venues existantes ou via l'email saisi
      // On stocke l'email du DJ — l'UID sera mis à jour quand le DJ se connecte
      const usersSnap = await getDocs(
        query(collection(db, "venues"), where("djUserIds", "array-contains", newDjEmail.trim()))
      );
      // On ajoute l'email comme identifiant provisoire (le DJ devra se connecter pour lier son UID)
      const updatedIds = [...(venue.djUserIds ?? []), newDjEmail.trim()];
      await updateDoc(doc(db, "venues", venue.id), { djUserIds: updatedIds });
      setVenue((prev) => prev ? { ...prev, djUserIds: updatedIds } : prev);
      setNewDjEmail("");
      toast.success("DJ ajouté. Il doit se connecter pour activer son accès.");
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingDj(false);
    }
  }

  async function handleRemoveDj(djId: string) {
    if (!venue) return;
    const updatedIds = (venue.djUserIds ?? []).filter((id) => id !== djId);
    await updateDoc(doc(db, "venues", venue.id), { djUserIds: updatedIds });
    setVenue((prev) => prev ? { ...prev, djUserIds: updatedIds } : prev);
    toast.success("DJ retiré");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!venue) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">{venue.name}</h1>
          <p className="text-base text-muted-foreground">Dashboard propriétaire</p>
        </div>
        <Button variant="ghost" size="lg" onClick={signOut} className="gap-2">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Personnalisation */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-bold">Personnalisation</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Nom du bar</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Couleur principale</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
              className="w-12 h-12 rounded-lg border cursor-pointer"
            />
            <Input
              value={form.primaryColor}
              onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
              className="h-12 text-base font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Logo (URL image)</label>
          <div className="flex items-center gap-3">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="logo" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            )}
            <Input
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
              className="h-12 text-base"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full text-base font-bold h-12">
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Gestion des DJs */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-bold">DJs</h2>

        <div className="space-y-2">
          {(venue.djUserIds ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun DJ ajouté.</p>
          )}
          {(venue.djUserIds ?? []).map((djId) => (
            <div key={djId} className="flex items-center justify-between gap-2 rounded-xl border p-3">
              <p className="text-sm font-mono truncate">{djId}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDj(djId)}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex gap-2">
          <Input
            placeholder="UID ou email du DJ"
            value={newDjEmail}
            onChange={(e) => setNewDjEmail(e.target.value)}
            className="h-12 text-base"
          />
          <Button onClick={handleAddDj} disabled={addingDj || !newDjEmail.trim()} size="lg" className="shrink-0">
            {addingDj ? "..." : "Ajouter"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Entre l'UID Firebase du DJ (depuis Firebase Console → Authentication)</p>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-lg font-bold">Statistiques</h2>
        <VenueStats venueId={venue.id} />
      </div>
    </main>
  );
}
