# Build stage - compile to standalone executable
FROM oven/bun:1 AS builder
WORKDIR /app

# Install native dependencies required for canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun build --compile --minify --sourcemap \
    ./src/index.js \
    --outfile=/app/tahmin-bot

# Runtime stage - minimal image with just the executable
FROM debian:bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/tahmin-bot /app/tahmin-bot

COPY --from=builder /app/src/data /app/src/data

EXPOSE 80

CMD ["/app/tahmin-bot"]