# Stage 1: Rust builder
FROM rust:1.88.0-slim-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src/bin && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > src/bin/migrate.rs && \
    cargo build --release 2>/dev/null || true

# Build actual app
COPY src/ src/
COPY migrations/ migrations/
RUN touch src/main.rs && cargo build --release

# Stage 2: Frontend builder
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 3: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/app /app/app
COPY --from=builder /app/target/release/migrate /app/migrate
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY migrations/ /app/migrations/

EXPOSE 3000

CMD ["/bin/sh", "-c", "/app/migrate && /app/app"]
