# Worklog (Work Tracker)

A personal client/work tracker, deployed as a single Cloudflare Worker (React SPA + Hono API + D1), gated by Google OAuth, with items addable via a personal API token.

Live at **https://cadence.peterbrooksbank.com**.

## Already done

- D1 database `work-tracker-db` created and migrated (both `--local` and `--remote`), seeded with one workspace: **Agency51**.
- `wrangler.jsonc` configured with the assets binding, D1 binding, `run_worker_first` for `/api/*` and `/auth/*`, and a `custom_domain` route for `cadence.peterbrooksbank.com`.
- Deployed, with `COOKIE_SECRET`, `ALLOWED_EMAIL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` set as Worker secrets.
- Google OAuth client's authorized redirect URI should be `https://cadence.peterbrooksbank.com/auth/callback` — update it in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) if it's still pointing at the old `*.workers.dev` URL.

## Remaining setup (run these yourself — they touch your live Cloudflare/Google accounts)

### 1. Install dependencies (if not already)

```sh
npm install
```

### 2. Set the non-Google secrets

```sh
openssl rand -base64 48 | wrangler secret put COOKIE_SECRET
echo "peter.c.brooksbank@gmail.com" | wrangler secret put ALLOWED_EMAIL
```

`ALLOWED_EMAIL` is the only Google account permitted to sign in — everyone else gets a 403 at `/auth/callback`.

### 3. Deploy once to get your Worker's URL

```sh
npm run deploy
```

Note the deployed URL, e.g. `https://work-tracker.<your-subdomain>.workers.dev`. Google sign-in won't work yet — that's expected, since `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` aren't set. Everything else (asset serving, `/api/config`) will already work.


### 4. Create a Google OAuth Client

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create (or reuse) a project.
2. **Create Credentials → OAuth client ID → Web application.**
3. Under **Authorized redirect URIs**, add:
   ```
   https://<your-subdomain>.workers.dev/auth/callback
   ```
   (and later your custom domain's `/auth/callback`, if you add one).
4. Copy the generated **Client ID** and **Client secret**.

### 5. Set the Google secrets

```sh
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

Secrets apply to the live Worker immediately — no redeploy needed. Sign in at your Worker's URL with `peter.c.brooksbank@gmail.com`.

## Local development

```sh
npm run dev
```

Starts Vite + the Worker (via `@cloudflare/vite-plugin`) against the **local** D1 database, using `.dev.vars` (already populated with a dev `COOKIE_SECRET` and your `ALLOWED_EMAIL`, `GOOGLE_CLIENT_ID`/`SECRET` left blank). Since real Google credentials aren't required locally, visit `/auth/dev-login` to sign in as `peter.c.brooksbank@gmail.com` without going through Google — this route only exists when `ENVIRONMENT !== "production"` (i.e. never on the deployed Worker, where `wrangler.jsonc` sets `ENVIRONMENT=production`).

If you change `migrations/*.sql`, re-apply locally with:

```sh
npm run db:migrate:local
```

and to production with:

```sh
npm run db:migrate:remote
```

## Workspaces

The toolbar has a workspace switcher (next to "Worklog") — it ships with just **Agency51**, but you can add more (e.g. "PureClarity") from the same dropdown at any time. Each workspace has its own clients and items; switching persists per-device via `localStorage`.

## Adding items via the API

Generate a personal token from the in-app **Settings** panel (gear icon, top right), then:

```sh
curl -X POST https://<your-subdomain>.workers.dev/api/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Some Client",
    "workspaceSlug": "agency51",
    "title": "New task from API",
    "priority": "high",
    "dueDate": "2026-08-01"
  }'
```

`clientName` + `workspaceSlug` (or `workspaceId`) auto-creates the client if it doesn't already exist in that workspace — or pass `clientId` directly if you already have it (`GET /api/clients?workspaceId=...`). `priority` is one of `high`/`med`/`low`, `status` (optional) is one of `todo`/`progress`/`done`.

Revoke a token any time from the same Settings panel.
