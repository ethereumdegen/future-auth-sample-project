use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::AppState;

/// User record created by FutureAuth SDK
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub email_verified: bool,
    pub image: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Axum extractor — validates session cookie, returns authenticated user
pub struct AuthUser {
    pub user: User,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let cookie_header = parts
            .headers
            .get("cookie")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        let session_token = cookie_header
            .split(';')
            .filter_map(|c| c.trim().strip_prefix("futureauth_session="))
            .next()
            .ok_or(StatusCode::UNAUTHORIZED)?;

        let session = sqlx::query_as::<_, (String,)>(
            "SELECT user_id FROM session WHERE token = $1 AND expires_at > NOW()",
        )
        .bind(session_token)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Session query failed: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?;

        let user = sqlx::query_as::<_, User>(
            r#"SELECT * FROM "user" WHERE id = $1"#,
        )
        .bind(&session.0)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("User query failed: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?;

        Ok(AuthUser { user })
    }
}
