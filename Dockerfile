FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts ./
COPY server ./server
COPY shared ./shared
COPY web ./web
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/migrations ./server/migrations
COPY scripts ./scripts
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 8080
CMD ["node", "dist/server/src/index.js"]
