"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    primaryColor: "#6366f1",
    logoUrl: "",
    ownerUserId: "",
    djEmail: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) { toast.error("Nom et slug requis"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "venues"), {
        name: form.name,
        slug: form.slug,
        isActive: true,
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl,
        ownerUserId: form.ownerUserId,
        djUserIds: [],
        createdAt: Timestamp.now(),
      });
      toast.success("Bar créé !");
      router.push("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <Toaster />
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-black">Nouveau bar</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Nom du bar</label>
          <Input
            placeholder="Le Manhattan"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Slug (URL)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/bar/</span>
            <Input
              placeholder="le-manhattan"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="h-12 text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Couleur principale</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="w-12 h-12 rounded-lg border cursor-pointer"
            />
            <Input
              value={form.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="h-12 text-base font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Logo (URL image)</label>
          <Input
            placeholder="https://..."
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">UID du propriétaire (Firebase Auth)</label>
          <Input
            placeholder="UID Firebase du gérant"
            value={form.ownerUserId}
            onChange={(e) => set("ownerUserId", e.target.value)}
            className="h-12 text-base font-mono"
          />
          <p className="text-xs text-muted-foreground">Trouve l'UID dans Firebase Console → Authentication</p>
        </div>

        <Button type="submit" size="lg" className="w-full text-base font-bold h-12" disabled={loading}>
          {loading ? "Création..." : "Créer le bar"}
        </Button>
      </form>
    </main>
  );
}
