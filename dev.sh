#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_PID=""
FRONTEND_PID=""

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local attempts=60

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$name is ready at $url"
      return 0
    fi

    sleep 1
  done

  printf '%s did not become ready at %s within %s seconds.\n' "$name" "$url" "$attempts" >&2
  return 1
}

open_frontend() {
  if command -v open >/dev/null 2>&1; then
    open "$FRONTEND_URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
  else
    log "Open $FRONTEND_URL in your browser."
  fi
}

cleanup() {
  log "Stopping development servers..."

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

require_command dotnet
require_command pnpm
require_command curl

log "Restoring backend packages..."
dotnet restore "$ROOT_DIR/backend/Kanban.Todo.slnx"

log "Installing frontend packages..."
pnpm --dir "$ROOT_DIR/frontend" install

if [[ ! -f "$ROOT_DIR/frontend/.env.local" && -f "$ROOT_DIR/frontend/.env.example" ]]; then
  log "Creating frontend/.env.local from .env.example..."
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
fi

log "Starting backend at $BACKEND_URL..."
dotnet run --project "$ROOT_DIR/backend/Kanban.Todo.Api" --urls "$BACKEND_URL" &
BACKEND_PID="$!"

wait_for_url "$BACKEND_URL/health" "Backend"

log "Starting frontend at $FRONTEND_URL..."
NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" pnpm --dir "$ROOT_DIR/frontend" dev &
FRONTEND_PID="$!"

wait_for_url "$FRONTEND_URL" "Frontend"
open_frontend

log "Development servers are running. Press Ctrl+C to stop both."
wait
