"use client";

import { useState, useEffect } from "react";

export type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
};

export function useSpotifySearch(query: string) {
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Erreur de recherche");
          setResults([]);
        } else {
          setResults(data.tracks);
        }
      } catch {
        setError("Erreur réseau");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, loading, error };
}
