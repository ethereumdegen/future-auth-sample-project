mod auth;

use axum::{
    Router,
    routing::get,
    Json,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{CorsLayer, AllowOrigin};
use tower_http::trace::TraceLayer;
use tower_http::services::ServeDir;
use http::Method;
use http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE};

use std::sync::Arc;
use futureauth::{FutureAuth, FutureAuthConfig};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub auth: Arc<FutureAuth>,
}

impl AsRef<Arc<FutureAuth>> for AppState {
    fn as_ref(&self) -> &Arc<FutureAuth> {
        &self.auth
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "app=debug,tower_http=debug".parse().unwrap()),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL is required");
    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "3000".into()).parse()?;
    let cors_origin = std::env::var("CORS_ORIGIN").unwrap_or_else(|_| "http://localhost:5173".into());
    let futureauth_api_url = std::env::var("FUTUREAUTH_API_URL").unwrap_or_else(|_| "https://future-auth.com".into());
    let futureauth_secret_key = std::env::var("FUTUREAUTH_SECRET_KEY").expect("FUTUREAUTH_SECRET_KEY is required");

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run app-specific migrations
    run_migrations(&db).await;

    // Initialize FutureAuth — creates user/session/verification tables
    let auth = FutureAuth::new(db.clone(), FutureAuthConfig {
        api_url: futureauth_api_url,
        secret_key: futureauth_secret_key,
        project_name: "My App".to_string(),
        ..Default::default()
    });
    auth.ensure_tables().await.expect("Failed to create auth tables");

    let state = AppState { db, auth };

    let origin = cors_origin.parse::<http::HeaderValue>().expect("Invalid CORS_ORIGIN");
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::exact(origin))
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, COOKIE])
        .allow_credentials(true);

    let app = Router::new()
        // Health check
        .route("/health", get(health))
        // FutureAuth routes: /api/auth/send-otp, verify-otp, session, sign-out
        .merge(futureauth::axum::auth_router(state.auth.clone()))
        // Protected API routes
        .route("/api/me", get(me))
        // Serve frontend (production)
        .fallback_service(ServeDir::new("frontend/dist").append_index_html_on_directories(true))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    tracing::info!("Server starting on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

/// Example protected endpoint — returns the authenticated user
async fn me(auth_user: auth::AuthUser) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "id": auth_user.user.id,
        "email": auth_user.user.email,
        "name": auth_user.user.name,
        "created_at": auth_user.user.created_at,
    }))
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn run_migrations(pool: &sqlx::PgPool) {
    let sql = include_str!("../migrations/001_init.sql");
    if let Err(e) = sqlx::raw_sql(sql).execute(pool).await {
        tracing::error!("Migration failed: {e}");
        std::process::exit(1);
    }
    tracing::info!("Migrations complete");
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to install CTRL+C signal handler");
    tracing::info!("Shutting down gracefully...");
}
