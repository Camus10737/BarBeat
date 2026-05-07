import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: "Minimum 3 caractères requis" }, { status: 400 });
  }

  try {
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`,
      { headers: { Accept: "application/json" } }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ error: `Erreur API iTunes (${searchRes.status})` }, { status: 502 });
    }

    const data = await searchRes.json();

    const tracks = data.results.map((track: {
      trackId: number;
      trackName: string;
      artistName: string;
      artworkUrl100: string;
      trackTimeMillis: number;
    }) => ({
      id: String(track.trackId),
      title: track.trackName,
      artist: track.artistName,
      coverUrl: track.artworkUrl100?.replace("100x100bb", "300x300bb") ?? "",
      duration: track.trackTimeMillis,
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
