import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotifyToken";

export async function GET() {
  try {
    const token = await getSpotifyToken();
    return NextResponse.json({ token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
