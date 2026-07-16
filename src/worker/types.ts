export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  ALLOWED_EMAIL: string;
  COOKIE_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { user: AuthUser };
};
