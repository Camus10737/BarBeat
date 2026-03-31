import { NextResponse } from "next/server";

// Cache du token en mémoire (valide 1h)
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function GET() {
  // Retourner le token en cache s'il est encore valide (avec 1 min de marge)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return NextResponse.json({ token: cachedToken.value });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Spotify credentials manquants" }, { status: 500 });
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Échec de l'authentification Spotify" }, { status: 502 });
  }

  const data = await response.json();

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return NextResponse.json({ token: cachedToken.value });
}
