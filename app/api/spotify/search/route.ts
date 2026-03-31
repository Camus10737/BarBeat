import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotifyToken";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: "Minimum 3 caractères requis" }, { status: 400 });
  }

  try {
    const token = await getSpotifyToken();

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ error: "Erreur API Spotify" }, { status: 502 });
    }

    const data = await searchRes.json();

    const tracks = data.tracks.items.map((track: {
      id: string;
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
      duration_ms: number;
    }) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      coverUrl: track.album.images[1]?.url ?? track.album.images[0]?.url ?? "",
      duration: track.duration_ms,
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
