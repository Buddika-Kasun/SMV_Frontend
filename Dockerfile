# # Multi-stage production build for Railway
# FROM node:20-alpine AS builder

# WORKDIR /app

# # Install dependencies (including devDependencies needed for build)
# COPY package*.json ./
# RUN npm install

# # -----------------------------------------------------------------
# # Vite build-time env vars — MUST be in the builder stage,
# # BEFORE `npm run build`, so Vite bakes them into the bundle.
# # -----------------------------------------------------------------
# ARG VITE_API_BASE_URL
# ARG VITE_APP_ENV=production
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# ENV VITE_APP_ENV=$VITE_APP_ENV

# # Copy source code and build
# COPY . .
# RUN npm run build

# # -----------------------------------------------------------------
# # Production runtime image
# # -----------------------------------------------------------------
# FROM node:20-alpine AS runner

# WORKDIR /app

# ENV NODE_ENV=production

# # Install production dependencies only
# COPY package*.json ./
# RUN npm install --omit=dev

# # Copy compiled frontend + the files vite preview needs at runtime
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/vite.config.ts ./vite.config.ts
# COPY --from=builder /app/tsconfig.json ./tsconfig.json
# COPY --from=builder /app/package.json ./package.json

# EXPOSE 3000

# CMD ["npm", "start"]

# Multi-stage production build for Railway
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
RUN npm install

# -----------------------------------------------------------------
# Vite build-time env vars — MUST be in the builder stage,
# BEFORE `npm run build`, so Vite bakes them into the bundle.
# -----------------------------------------------------------------
ARG VITE_API_BASE_URL
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

# Copy source code and build
COPY . .
RUN npm run build

# -----------------------------------------------------------------
# Production runtime image — static file server
# -----------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Tiny static server — no Vite, no config parsing, no dev deps
RUN npm install -g serve@14

# Copy ONLY the built output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# -s → SPA fallback (routes like /dashboard serve index.html)
# -l → listen on Railway's injected PORT (falls back to 3000)
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]