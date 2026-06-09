FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache curl git

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

ENV PORT=3001
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/conductor.db
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
