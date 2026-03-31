import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: "Minimum 3 caractères requis" }, { status: 400 });
  }

  // Récupérer le token depuis notre route interne
  const tokenRes = await fetch(`${request.nextUrl.origin}/api/spotify/token`);
  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Impossible d'obtenir le token Spotify" }, { status: 502 });
  }
  const { token } = await tokenRes.json();

  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.status === 401) {
    return NextResponse.json({ error: "Token Spotify expiré" }, { status: 401 });
  }

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
}
