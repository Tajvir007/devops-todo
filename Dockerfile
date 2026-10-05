# ---------- Stage 1: install production dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: final runtime image ----------
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Copy only what the app needs at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Run as the built-in non-root user
USER node

EXPOSE 3000

# Container is marked unhealthy if /health stops responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
