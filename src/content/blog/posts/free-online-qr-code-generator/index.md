---
date: 2025-05-24T08:47:42Z
back_ref: /blog/_index.md
draft: false
title: Free online QR code generator (no signup, SVG + PNG)
description:
  "A free QR code generator that gives you SVG and PNG without registration,
  OAuth, or paywalls. Runs client-side; only pageviews get tracked."
image: "qrcode.png"
keywords:
  - QR code generator
  - free QR code generator
  - online QR code
  - SVG QR code
  - PNG QR code
  - QR code without registration
  - QR code maker
  - download QR code SVG
  - QR code generator no signup
  - client-side QR code
---

What a shame -- nowadays, one quick request to GPT spits out a proper HTML page
with a full-fledged QR code generator...[^1] and yet I wasted _way_ more time
Googling for a free generator that could give me `png` and `svg`. Every single
one wants registration, logging in through some OAuth nonsense, or worst of all,
a payment for an `svg` 🤦🏼.

So I made my own.

Here’s a free QR code generator. No sign-ups, no fees, works. I’m only tracking
pageviews, so chill.

(And yep, I gotta throw in some text here to make search engines happy 🙃)

## Generate a QR code

<iframe src="/text/qr-code-generator.html" title="QR code generator" style="width:100%;border:0"></iframe>

## Paste text, download SVG or PNG

Wanna skip straight to it? Here’s the
[direct link](/text/qr-code-generator.html).

{data-content="footnotes"}

[^1]:
    Digging into it with `.svg` took more time. Current GPT didn't know current
    versions, and current versions had bugs, so I had to fork it.
