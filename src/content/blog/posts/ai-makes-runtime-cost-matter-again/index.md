---
date: 2026-05-18T12:00:00Z
back_ref: /blog/_index.md
draft: false
title: Runtime cost matters to me now
description:
  "Cloud exposes runtime cost. AI lowers code-production cost. That changes the
  unit economics of programming languages."
image: hero.png
---

AI made me reopen a boring question: why am I still paying Fargate rent for V8?

Bun's Zig-to-Rust AI rewrite got me running the math -- 6 days, 960'000 lines,
99.8% of Bun's existing tests passing, 9 days to merge ($10'000 total AI
spent?)[^1].

What does that look like for 15'844 LOC of my own microservice on Fargate?

## My setup

Node.js microservice, talks to MongoDB, calls a few neighbors, responds to
others, does its small thing. A typical service sits at 0.5 vCPU / 1 GB RAM --
_$18/month_ per task. Three replicas minimum for robustness, so _$54/month_ per
service.

Most of that bill is provisioned runtime headroom. Node makes that headroom
harder to shrink. V8, dynamic dispatch, garbage collection, startup time, memory
spikes. The runtime pays rent on Fargate while I'm paying for it.

### One rewrite, run the math

Say _$100_ in Claude Code tokens to produce a first port to Go or Rust. Not to
ship it blindly -- review, tests, and rollout still cost human time. But the
first draft is no longer the expensive part.

Fargate bills _$0.04048_ per vCPU-hour and _$0.004445_ per GB-hour[^2]. Minimum
task size: 0.25 vCPU / 0.5 GB, about _$9/month_. A compiled service with a Mongo
driver and a couple of HTTP clients belongs at that floor. No V8. No managed
runtime heap sitting around waiting for traffic.

New bill for that service: 3 x $9 = _$27/month_; **2x savings**.

Payback on _$100_ of AI: under four months; for one service in minimal setup.

That is the toy version. My real setup has dev, prod, workload replicas,
autotests, and the usual operational mess. Around ten replicas. Payback lands
near one month.

### The cluster framing

The language map changes:

- **Rust / C / C++** -- smallest runtime footprint. Highest migration friction.
  Ecosystem question still open for my services.
- **Go** -- small runtime tax, boring deployment, strong backend ecosystem.
  Looks like the new default from the cost side.[^3]
- **Node / Python / PHP / Java / C#** -- still productive defaults, but their
  runtime footprint is no longer free. Fargate turns it into a line item.

The runtime tax used to hide inside developer productivity. AI lowers the cost
of moving code. Cloud exposes the cost of keeping code running. That makes
runtime choice visible again.

## Plan B

Or move off AWS to Hetzner and cut the bill by ~10x.

{data-content="footnotes"}

[^1]:
    https://www.theregister.com/2026/05/14/anthropics_bun_rust_rewrite_merged_at_speed_of_ai/5240381

[^2]: https://aws.amazon.com/fargate/pricing/

[^3]:
    I’ve personally never been a Rust fan. Go, though, I’ve used for _really_
    loaded things. C/C++ lives somewhere in old education.
