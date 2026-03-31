import FingerprintJS from "@fingerprintjs/fingerprintjs";

const STORAGE_KEY = "barbeat_fp";

let cachedFingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  // Retourner le cache mémoire si disponible
  if (cachedFingerprint) return cachedFingerprint;

  // Retourner le localStorage si disponible
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    cachedFingerprint = stored;
    return stored;
  }

  // Générer un nouveau fingerprint
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  localStorage.setItem(STORAGE_KEY, visitorId);
  cachedFingerprint = visitorId;

  return visitorId;
}
