ARG BUN_VERSION=latest
FROM oven/bun:${BUN_VERSION}

RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    ca-certificates \
    git \
    && apt-get auto-remove -y \
    && apt-get clean -y

USER bun
