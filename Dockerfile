# Multi-stage production build for Railway
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
RUN npm install

# Copy source code and build React frontend + Express backend bundle
COPY . .
RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and backend bundle from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]

