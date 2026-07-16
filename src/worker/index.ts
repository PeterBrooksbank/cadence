import { Hono } from "hono";
import type { AppEnv } from "./types";
import { authApiRoutes, authRoutes } from "./routes/auth";
import { requireAuth } from "./auth/middleware";
import { tokenRoutes } from "./routes/tokens";
import { workspaceRoutes } from "./routes/workspaces";
import { clientRoutes } from "./routes/clients";
import { itemRoutes } from "./routes/items";

const app = new Hono<AppEnv>();

app.route("/auth", authRoutes);
app.route("/api/auth", authApiRoutes);

app.get("/api/config", (c) => c.json({ devLoginEnabled: c.env.ENVIRONMENT !== "production" }));

const api = new Hono<AppEnv>();
api.use("*", requireAuth);
api.get("/me", (c) => c.json(c.get("user")));
api.route("/tokens", tokenRoutes);
api.route("/workspaces", workspaceRoutes);
api.route("/clients", clientRoutes);
api.route("/items", itemRoutes);

app.route("/api", api);

export default app;
