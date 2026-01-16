FROM rust:1.88.0 AS builder
WORKDIR /app
COPY apps/aggregator/Cargo.toml apps/aggregator/Cargo.lock ./apps/aggregator/
RUN mkdir -p apps/aggregator/src/bin && \
    echo "fn main(){}" > apps/aggregator/src/main.rs && \
    echo "pub fn dummy(){}" > apps/aggregator/src/lib.rs && \
    echo "fn main(){}" > apps/aggregator/src/bin/nvb.rs && \
    echo "fn main(){}" > apps/aggregator/src/bin/stagemarkt.rs
RUN cd apps/aggregator && cargo build --release
COPY apps/aggregator/src ./apps/aggregator/src
RUN cd apps/aggregator && touch src/lib.rs src/main.rs src/bin/*.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/apps/aggregator/target/release/scrapers /usr/local/bin/scrapers
COPY --from=builder /app/apps/aggregator/target/release/nvb /usr/local/bin/nvb
COPY --from=builder /app/apps/aggregator/target/release/stagemarkt /usr/local/bin/stagemarkt
ENV RUST_LOG=info
CMD ["/usr/local/bin/scrapers"]
