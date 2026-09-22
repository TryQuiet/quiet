FROM node:22.14.0-slim
WORKDIR /qss
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts \
    && pnpm --stream -r build
WORKDIR /qss/app
CMD ["node", "dist/src/main.js"]
