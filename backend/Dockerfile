FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
