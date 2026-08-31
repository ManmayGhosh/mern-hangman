# Debian-based (not alpine) so the standard "wamerican-large" apt package
# is available — a real, large English word list with zero npm dependency,
# avoiding any package-export-format issues at runtime.
FROM node:20-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends wamerican-large wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
