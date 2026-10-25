# Scalping Squishies API. Build context is the project root (scalping-squishies/).
FROM node:22-alpine
WORKDIR /app
COPY server/index.mjs ./server/
ENV NODE_ENV=production SS_PORT=8787 SS_DB=/data/data.db
EXPOSE 8787
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8787/v1/health || exit 1
CMD ["node", "server/index.mjs"]
