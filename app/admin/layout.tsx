"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/dj/login"); return; }
    isAdmin(user.uid).then((ok) => {
      if (!ok) router.replace("/dj/login");
      else setChecking(false);
    });
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Vérification...</p>
      </div>
    );
  }

  return <>{children}</>;
}
