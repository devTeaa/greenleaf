FROM alpine:3.20

# Pocketbase is a single static Go binary — no runtime deps, no Node, no build step.
# We just download the binary and run it.

ARG PB_VERSION=0.39.7
ARG PB_ARCH=amd64

RUN apk add --no-cache unzip ca-certificates tzdata \
 && wget -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
 && unzip /tmp/pb.zip -d /pb \
 && rm /tmp/pb.zip \
 && chmod +x /pb/pocketbase

EXPOSE 3001

# Bind to all interfaces so the docker network can reach it.
# PB serves the admin UI at /_/ and REST API at /api/.
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:3001", "--origins=*"]
