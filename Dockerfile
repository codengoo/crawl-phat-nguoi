# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM mcr.microsoft.com/playwright:v1.58.2-jammy AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]