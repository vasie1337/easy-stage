FROM rust:1.88.0 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src/bin && \
    echo "fn main(){}" > src/main.rs && \
    echo "pub fn dummy(){}" > src/lib.rs && \
    echo "fn main(){}" > src/bin/nvb.rs && \
    echo "fn main(){}" > src/bin/stagemarkt.rs
RUN cargo build --release
COPY src ./src
RUN touch src/lib.rs src/main.rs src/bin/*.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-amd64 -o /usr/local/bin/supercronic \
    && chmod +x /usr/local/bin/supercronic
COPY --from=builder /app/target/release/scrapers /usr/local/bin/scrapers
COPY --from=builder /app/target/release/nvb /usr/local/bin/nvb
COPY --from=builder /app/target/release/stagemarkt /usr/local/bin/stagemarkt
ENV RUST_LOG=info
CMD ["scrapers"]
