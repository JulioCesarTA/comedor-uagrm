# ============ STAGE 1: build ============
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json nest-cli.json ./
RUN npm install --no-audit --no-fund
COPY src ./src
RUN npm run build

# ============ STAGE 2: runtime ============
FROM node:20-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN chown -R app:app /app
USER app
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -q -O - http://localhost:8080/health || exit 1
CMD ["node", "dist/main.js"]
