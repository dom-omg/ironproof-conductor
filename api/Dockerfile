FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ curl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++ curl git
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

ENV PORT=3001
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/conductor.db
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
