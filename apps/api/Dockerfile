# Stage 1: Build NestJS API and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for Prisma and native packages (like bcrypt)
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Copy package manifests and Prisma schema
COPY package*.json ./
COPY prisma/ ./prisma/

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy compiler config and application source code
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Build application
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

# Production environment variables
ENV NODE_ENV=production \
    PORT=3000

# Install runtime utilities (curl for healthcheck, openssl/libc6-compat for Prisma query engine)
RUN apk add --no-cache curl openssl libc6-compat

# Set up non-root user node
RUN chown -R node:node /app

# Copy production artifacts from builder stage with node ownership
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Switch to non-root user
USER node

# Expose API port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/docs || exit 1

# Start NestJS application
CMD ["node", "dist/main.js"]
