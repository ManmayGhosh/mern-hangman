#!/bin/sh
set -e

# Writes a tiny runtime config file the frontend reads on page load.
# This runs every time the CONTAINER STARTS, not at build time — so the same
# built image can point at different backends in different environments
# (Docker Compose vs. Render vs. anywhere else) just by setting BACKEND_URL,
# with no rebuild required.
#
# - Docker Compose: leave BACKEND_URL unset. It falls back to the relative
#   path "/api", which nginx.conf proxies to the "backend" service on the
#   internal Compose network.
# - Render (or any setup with the frontend and backend as separate public
#   services): set BACKEND_URL to the backend's full public URL plus /api,
#   e.g. https://hangman-backend-xxxx.onrender.com/api. The frontend will
#   call that directly, bypassing the nginx proxy entirely.

TARGET=/usr/share/nginx/html/env-config.js
API_URL="${BACKEND_URL:-/api}"

echo "window.__APP_CONFIG__ = { API_URL: \"${API_URL}\" };" > "$TARGET"
echo "[entrypoint] API_URL set to: ${API_URL}"

exec "$@"
