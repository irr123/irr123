---
date: 2026-05-09T12:00:00Z
back_ref: /blog/_index.md
draft: false
title:
  "Docker images are hundreds of MB; a full game engine compiles to 35MB WASM"
description:
  "A full 3D game -- renderer, physics engine, scripting runtime -- exported to
  WebAssembly is 35MB. The default Node.js Docker image is hundreds of MB,
  pulled 19 million times last week."
image: hero.png
---

I exported a game skeleton to WebAssembly a few hours ago and was surprised by
the artifact size. Full 3D engine -- GL Compatibility renderer, Jolt physics,
GDScript runtime, Ink narrative interpreter. The binary: 35MB. Runs in any
browser, zero install.

Facebook's homepage loads 44MB. The game engine is 35MB.

## Try it

[Fullscreen](https://pub-cab470135ad64bbf9490e4c1ce5fa431.r2.dev/stanica/index.html),
WASD, Esc.

###### The thing that weighs less than a base image

<div id="stanica-play" style="width:100%;height:540px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--fg);color:var(--bg);font-size:0.9rem;user-select:none;">▶ play in browser · 35 MB</div>
<script type="module">
  document.getElementById("stanica-play").addEventListener("click", function () {
    const f = document.createElement("iframe");
    f.src = "https://pub-cab470135ad64bbf9490e4c1ce5fa431.r2.dev/stanica/index.html";
    f.style.cssText = "width:100%;border:none;height:540px;display:block;";
    this.replaceWith(f);
  });
</script>

`python:3.14-slim-trixie` -- the slim base, before you add a single dependency
-- is 144MB. Even a [careful minimal build with
uv]({{< relref "blog/posts/docker-uv" >}}) lands at 282MB.

## Landscape

Sizes from my browser and local Docker cache:

| Item                                            | Size       |
| ----------------------------------------------- | ---------- |
| Google homepage (all resources, 43 requests)    | 10MB       |
| this game (Godot 4, full engine)                | 35MB       |
| Facebook homepage (all resources, 379 requests) | 44MB       |
| livekit/livekit-server (Go, WebRTC)             | 75MB       |
| python:3.14-slim-trixie                         | 144MB      |
| python:3.14-slim-trixie + minimal deps          | 282MB      |
| REST API from my job                            | 300--400MB |
| node:latest (19M pulls/week)                    | 421MB      |
| ghcr.io/gohugoio/hugo                           | 423MB      |
| Python-based AI agent from my job               | 1.45GB     |

Hugo: 423MB to generate static HTML. The game engine is 35MB 😌

The Go binaries (livekit at 75MB) are already close.

## The open question

On one hand, Go could be a solution, but `wasip1` is still preview -- no sockets
in the standard runtime, no threads. Zig is closer, but not there either. Only
Rust and C/C++ are practical options today.

On the other hand -- Cloudflare Workers can load WASM modules, containerd has
runwasi, Kubernetes has kwasm experiments, WASI runtimes exist.

So why has WASM adoption stalled? The transfer-size case is already there:
roughly 10×. Why isn't that enough to become standard practice?

Same as ARM nodes a few years ago: cheaper, denser, widely available -- still
not the default choice.
