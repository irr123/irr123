---
date: 2025-05-24T08:47:42Z
back_ref: /blog/_index.md
draft: false
title: Free online QR code generator (no signup, SVG + PNG)
description:
  "A free QR code generator that gives you SVG and PNG without registration,
  OAuth, or paywalls. Runs client-side; only pageviews get tracked."
image: "qrcode.png"
---

One quick request to GPT now spits out a proper HTML page with a QR code
generator.[^1] I still wasted _way_ more time Googling for a free generator that
could give me `png` and `svg`. Every one wanted registration, OAuth login, or,
worst of all, payment for an `svg` 🤦🏼.

So I made my own.

Here’s a free QR code generator. No sign-ups, no fees. It works. I only track
pageviews.

Search engines still demand text around a tool. Commodity blogging as tribute 🙃

## Generate a QR code

<iframe src="/text/qr-code-generator.html" title="QR code generator" style="width:100%;border:0"></iframe>

## Paste text, download SVG or PNG

Skip the post. Use the [direct link](/text/qr-code-generator.html).

{data-content="footnotes"}

[^1]:
    Digging into it with `.svg` took more time. Current GPT didn't know current
    versions, and current versions had bugs, so I had to fork it.
