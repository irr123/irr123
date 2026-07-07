---
date: 2025-09-10T03:43:41Z
back_ref: /blog/_index.md
draft: false
title: "JSON analyzer: find which keys bloat your payload"
description:
  "A free, client-side JSON analyzer that breaks down payload size by key. Find
  which fields bloat your slow API response. No upload; runs in the browser."
image: "main.png"
---

Large JSON payloads often hide the waste in boring repeated keys. I made a small
client-side tool to find them. Paste JSON, see the heaviest fields, cut the
payload. No upload.

## Analyze JSON in the browser

<iframe src="/text/json-analyzer.html" title="JSON analyzer" style="width:100%;border:0"></iframe>

## Paste JSON, find heavy keys

Use the [fullscreen version](/text/json-analyzer.html) if the iframe feels
small.
