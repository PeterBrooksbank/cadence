import { base64UrlDecode, base64UrlEncode } from "./base64url";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const OAUTH_STATE_TTL_SECONDS = 60 * 5; // 5 minutes

export interface SessionPayload {
  uid: string;
  email: string;
  exp: number;
}

export interface OAuthStatePayload {
  state: string;
  verifier: string;
  exp: number;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: object, secret: string): Promise<string> {
  const data = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64UrlEncode(sig)}`;
}

async function verifyPayload<T extends { exp: number }>(value: string, secret: string): Promise<T | null> {
  const [data, sig] = value.split(".");
  if (!data || !sig) return null;
  const key = await hmacKey(secret);
  let sigBytes: Uint8Array;
  try {
    sigBytes = base64UrlDecode(sig);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(data))) as T;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookieValue(uid: string, email: string, secret: string): Promise<string> {
  const payload: SessionPayload = { uid, email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  return signPayload(payload, secret);
}

export function verifySessionCookieValue(value: string, secret: string): Promise<SessionPayload | null> {
  return verifyPayload<SessionPayload>(value, secret);
}

export async function createOAuthStateCookieValue(state: string, verifier: string, secret: string): Promise<string> {
  const payload: OAuthStatePayload = { state, verifier, exp: Math.floor(Date.now() / 1000) + OAUTH_STATE_TTL_SECONDS };
  return signPayload(payload, secret);
}

export function verifyOAuthStateCookieValue(value: string, secret: string): Promise<OAuthStatePayload | null> {
  return verifyPayload<OAuthStatePayload>(value, secret);
}
