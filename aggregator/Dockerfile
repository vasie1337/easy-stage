FROM rust:1.88.0 AS builder
WORKDIR /app
COPY aggregator/Cargo.toml aggregator/Cargo.lock ./aggregator/
RUN mkdir -p aggregator/src/bin && \
    echo "fn main(){}" > aggregator/src/main.rs && \
    echo "pub fn dummy(){}" > aggregator/src/lib.rs && \
    echo "fn main(){}" > aggregator/src/bin/nvb.rs && \
    echo "fn main(){}" > aggregator/src/bin/stagemarkt.rs
RUN cd aggregator && cargo build --release
COPY aggregator/src ./aggregator/src
RUN cd aggregator && touch src/lib.rs src/main.rs src/bin/*.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/aggregator/target/release/scrapers /usr/local/bin/scrapers
COPY --from=builder /app/aggregator/target/release/nvb /usr/local/bin/nvb
COPY --from=builder /app/aggregator/target/release/stagemarkt /usr/local/bin/stagemarkt
ENV RUST_LOG=info
CMD ["/usr/local/bin/scrapers"]
