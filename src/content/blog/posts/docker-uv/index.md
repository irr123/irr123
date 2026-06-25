---
date: 2025-02-18T12:39:42Z
back_ref: /blog/_index.md
draft: false
title: A minimal Python3 Dockerfile with uv
description:
  "uv collapses Python image build time in CI compared to pip. A minimal
  multi-stage Dockerfile, the lockfile dance, and what to skip locally."
image: posts-docker-uv-1.jpg
---

I noticed that my simple
[python3 docker image](https://hub.docker.com/repository/docker/c1rno/python)
with uv has an unexpected number of downloads, so I decided to steal some
traffic from the original https://docs.astral.sh/uv/guides/integration/docker/
page.

## What is uv?

![Create image illustration in anime style included python3's snake, rust and uv (it's new package manager for python written in rust)](posts-docker-uv-1.jpg)

Long story short -- [uv](https://github.com/astral-sh/uv) is a fast Rust-based
Python pip alternative. It also replaces `python3 -m  venv ./venv`, and probably
more by the time I reread this.

## Minimal uv Dockerfile

So, don't use old one and [two](https://github.com/irr123/python-docker). Do it
properly:

```bash
ARG BASE_IMAGE=python:3.14-slim-trixie
ARG UV_VERSION=0.10.4-python3.14-trixie-slim

FROM ghcr.io/astral-sh/uv:$UV_VERSION AS uv_carrier
FROM $BASE_IMAGE AS builder

COPY --from=uv_carrier /usr/local/bin/uv /usr/local/bin/
RUN uv venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH

COPY ./requirements.txt requirements.txt
RUN uv pip install -r requirements.txt

FROM $BASE_IMAGE

ENV PYTHONUNBUFFERED=1 \
    PATH=/opt/venv/bin:$PATH

COPY --from=builder /opt/venv /opt/venv

COPY . /opt/app
RUN python -m compileall -q -j 0 /opt/app
WORKDIR /opt/app
```

## CI verdict: use uv where it saves time

Personally I don't see any reason to spend time setting up uv locally, but on CI
it saves a lot of time. Don't waste it!
