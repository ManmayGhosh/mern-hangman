#!/bin/sh
set -e

# Runs every time the CONTAINER STARTS (not at build time), doing two things
# based on the BACKEND_URL environment variable:
#
#  1. Writes a tiny runtime config the frontend JS reads on page load, so it
#     knows where to send API calls.
#  2. Picks which nginx server config to use — critical because nginx
#     resolves every proxy_pass hostname at STARTUP. A config that
#     unconditionally proxies to "backend" (the Docker Compose hostname)
#     would crash nginx entirely on platforms like Render, where that
#     hostname doesn't exist — even though no request would ever hit it.
#
# - BACKEND_URL unset (Docker Compose): frontend calls relative "/api",
#   proxied by nginx to the "backend" service on the internal Compose
#   network. Uses nginx-templates/with-proxy.conf.
# - BACKEND_URL set (e.g. Render, pointing at a separate public backend
#   service): frontend calls that URL directly from the browser, bypassing
#   nginx entirely for API calls. Uses nginx-templates/no-proxy.conf, so
#   nginx never even tries to resolve "backend".

CONFIG_JS=/usr/share/nginx/html/env-config.js
NGINX_CONF=/etc/nginx/conf.d/default.conf
TEMPLATES_DIR=/etc/nginx/conf-templates

API_URL="${BACKEND_URL:-/api}"
echo "window.__APP_CONFIG__ = { API_URL: \"${API_URL}\" };" > "$CONFIG_JS"
echo "[entrypoint] API_URL set to: ${API_URL}"

if [ -n "$BACKEND_URL" ]; then
  cp "$TEMPLATES_DIR/no-proxy.conf" "$NGINX_CONF"
  echo "[entrypoint] Using no-proxy nginx config (BACKEND_URL is set)."
else
  cp "$TEMPLATES_DIR/with-proxy.conf" "$NGINX_CONF"
  echo "[entrypoint] Using Compose-proxy nginx config (BACKEND_URL is unset)."
fi

exec "$@"
