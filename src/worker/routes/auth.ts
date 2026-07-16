import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import { buildGoogleAuthUrl, exchangeCodeForTokens, generatePkce, generateState, verifyGoogleIdToken } from "../auth/google";
import { createOAuthStateCookieValue, createSessionCookieValue, verifyOAuthStateCookieValue } from "../auth/session";
import { OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME } from "../auth/constants";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function callbackRedirectUri(reqUrl: string): string {
  const url = new URL(reqUrl);
  return new URL("/auth/callback", url.origin).toString();
}

async function upsertUser(db: D1Database, id: string, email: string, name: string | null) {
  await db
    .prepare(
      `INSERT INTO users (id, email, name) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name`,
    )
    .bind(id, email, name)
    .run();
}

async function issueSession(c: import("hono").Context<AppEnv>, uid: string, email: string) {
  const value = await createSessionCookieValue(uid, email, c.env.COOKIE_SECRET);
  setCookie(c, SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export const authRoutes = new Hono<AppEnv>();

authRoutes.get("/login", async (c) => {
  const { verifier, challenge } = await generatePkce();
  const state = generateState();
  const cookieValue = await createOAuthStateCookieValue(state, verifier, c.env.COOKIE_SECRET);
  setCookie(c, OAUTH_STATE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    path: "/auth",
    maxAge: 300,
  });
  const authUrl = buildGoogleAuthUrl({
    clientId: c.env.GOOGLE_CLIENT_ID,
    redirectUri: callbackRedirectUri(c.req.url),
    state,
    challenge,
  });
  return c.redirect(authUrl);
});

authRoutes.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const oauthCookie = getCookie(c, OAUTH_STATE_COOKIE_NAME);
  deleteCookie(c, OAUTH_STATE_COOKIE_NAME, { path: "/auth" });

  if (!code || !state || !oauthCookie) {
    return c.text("Missing OAuth parameters. Please try signing in again.", 400);
  }
  const stored = await verifyOAuthStateCookieValue(oauthCookie, c.env.COOKIE_SECRET);
  if (!stored || stored.state !== state) {
    return c.text("OAuth state mismatch. Please try signing in again.", 400);
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      verifier: stored.verifier,
      redirectUri: callbackRedirectUri(c.req.url),
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
    });
    const claims = await verifyGoogleIdToken(tokens.id_token, c.env.GOOGLE_CLIENT_ID);

    if (claims.email.toLowerCase() !== c.env.ALLOWED_EMAIL.toLowerCase()) {
      return c.text(`This app is restricted to a specific Google account. Signed in as ${claims.email}.`, 403);
    }

    await upsertUser(c.env.DB, claims.sub, claims.email, claims.name ?? null);
    await issueSession(c, claims.sub, claims.email);
    return c.redirect("/");
  } catch (err) {
    console.error("OAuth callback failed", err);
    return c.text("Sign-in failed. Please try again.", 400);
  }
});

authRoutes.get("/dev-login", async (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return c.text("Not found", 404);
  }
  const devId = "usr_dev";
  await upsertUser(c.env.DB, devId, c.env.ALLOWED_EMAIL, "Dev User");
  await issueSession(c, devId, c.env.ALLOWED_EMAIL);
  return c.redirect("/");
});

export const authApiRoutes = new Hono<AppEnv>();

authApiRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});
