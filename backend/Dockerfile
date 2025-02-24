FROM oven/bun:latest AS base
WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile
EXPOSE 3000

ENTRYPOINT [ "bun", "start"]