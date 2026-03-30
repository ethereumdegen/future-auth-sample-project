# FutureAuth Template

A starter template for Rust/Axum apps with [FutureAuth](https://future-auth.com) passwordless OTP authentication.

**Stack:** Rust + Axum + PostgreSQL + React + Tailwind CSS + FutureAuth SDK

## What's included

- Email OTP sign-in (no passwords, no user table to manage)
- Session-based auth with `AuthUser` extractor
- React frontend with sign-in flow and protected dashboard
- Database migrations (with a proper migration runner)
- Docker + Railway deployment ready
- Dev script for local development

## Quick start

### 1. Create a FutureAuth project

1. Go to [future-auth.com](https://future-auth.com) and sign in
2. Create a new project (choose Email OTP)
3. Copy the **secret key** shown on creation

### 2. Set up your database

You need a PostgreSQL database. A local install works fine, or use a cloud-hosted database like [Neon](https://neon.tech), [Supabase](https://supabase.com), or any other PostgreSQL provider.

```bash
createdb myapp
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/myapp
FUTUREAUTH_SECRET_KEY=vx_sec_your_key_here
```

### 4. Run locally

```bash
chmod +x dev.sh
./dev.sh
```

Or run backend and frontend separately:

```bash
# Terminal 1: Backend (port 3000)
cargo run

# Terminal 2: Frontend (port 5173)
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter your email, and sign in with the OTP code.

## Deploy to Railway

This template is ready for [Railway](https://railway.app) deployment.

1. Push this repo to GitHub
2. Create a new project on Railway
3. Add a **PostgreSQL** database service
4. Add a new service from your GitHub repo
5. Set environment variables:
   - `DATABASE_URL` — auto-set if you link the Postgres service
   - `FUTUREAUTH_SECRET_KEY` — your project secret key
   - `CORS_ORIGIN` — your Railway app URL (e.g. `https://myapp.up.railway.app`)
   - `PORT` — Railway sets this automatically
6. Deploy — migrations run automatically on startup

The included `railway.toml` configures the build, health checks, and restart policy.

## Deploy with Docker

```bash
docker build -t myapp .
docker run -p 3000:3000 --env-file .env myapp
```

In production, set `CORS_ORIGIN` to your domain (e.g. `https://myapp.com`).

## Project structure

```
src/
  main.rs            # Axum server, routes, FutureAuth init
  auth.rs            # AuthUser extractor for protected routes
  bin/migrate.rs     # Database migration runner
migrations/          # SQL migrations (add your app tables here)
frontend/
  src/
    App.tsx          # Router + auth guard
    lib/
      auth-client.ts # FutureAuth client (better-auth)
    pages/
      SignIn.tsx     # Email OTP sign-in
      Dashboard.tsx  # Protected dashboard page
Dockerfile           # Multi-stage build (Rust + Node)
railway.toml         # Railway deployment config
dev.sh               # Local dev startup script
```

## How it works

**FutureAuth** is an OTP delivery service. The SDK (`futureauth` crate) runs in your app and manages all auth data in **your** PostgreSQL database:

1. User enters email on the sign-in page
2. SDK generates a random code, stores it locally, and calls FutureAuth to deliver it via email
3. User enters the code — SDK verifies it locally, creates/finds the user, and creates a session
4. A `futureauth_session` cookie is set — the `AuthUser` extractor validates it on protected routes

FutureAuth never sees your database. Users, sessions, and verification codes all live in your own Postgres.

## Adding protected routes

Use the `AuthUser` extractor to require authentication:

```rust
use crate::auth::AuthUser;

async fn my_handler(auth: AuthUser) -> Json<serde_json::Value> {
    // auth.user has id, email, name, created_at, etc.
    Json(serde_json::json!({ "hello": auth.user.email }))
}

// Add to the router in main.rs:
.route("/api/my-endpoint", get(my_handler))
```

## Adding database tables

1. Create a new migration file in `migrations/` (e.g. `002_todos.sql`)
2. Reference the FutureAuth `"user"` table for foreign keys:

```sql
CREATE TABLE IF NOT EXISTS todo (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

3. Migrations run automatically on startup, or manually with `cargo run --bin migrate`

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `FUTUREAUTH_SECRET_KEY` | Yes | — | Project secret key from FutureAuth dashboard |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `FUTUREAUTH_API_URL` | No | `https://future-auth.com` | FutureAuth API URL |
