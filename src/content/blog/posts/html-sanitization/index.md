---
date: 2025-09-05T08:13:44Z
back_ref: /blog/_index.md
draft: false
title: "HTML sanitization: the double-encoding trap"
description:
  "Sanitizing HTML on both ingest and output renders literal `&amp;` in the UI.
  Fix: store raw Unicode, sanitize once. Pattern for React, Next.js, NestJS."
image: "sanitization.png"
keywords:
  - HTML sanitization
  - double encoding
  - double escaping
  - XSS prevention
  - sanitize on ingest
  - sanitize on output
  - React XSS
  - Next.js sanitization
  - NestJS sanitization
  - character entity double-escape
  - web security audit
  - DOMPurify
---

Once upon a time, I went through another security audit on a project that wasn't
particularly old but had passed through the hands of several teams. After the
first round of penetration testing, the auditing team found a lack of data
sanitization on the backend side.

With proof. Quite disappointing.

![data processing pipe](sanitization.png)

> **Warning:** This article is NOT a recommendation to abandon standard HTML
> entity encoding. This method should only be considered by those who fully
> understand the security implications and are facing the exact double-encoding
> problem described here.

## Constraint: sanitize on ingest and output

As a result, security auditing team presented us with demands:

1. Sanitize all data coming from client to server on server side;
   - _Sanitize on Ingest_: A "defense in depth" strategy. Never trust user input
     and clean it before it touches the database. Classic security requirement.

2. Sanitize all data coming from server to client on client side;
   - _Sanitize on Output_: The modern web development approach --- sanitize data
     for the specific context it's being used in (e.g., HTML, CSS, a URL) at the
     last possible moment. This is considered the most effective way to prevent
     XSS.

Our tech stack was a fairly standard setup: a few microservices built with
NestJS and a Next.js frontend. And _Sanitize on Output_ is a standard security
practice in React (which powers Next.js); it already protects against HTML
injection by default by sanitizing all rendered output. Disabling this is a
major anti-pattern.

## The double-encoding issue

It wasn't a big deal to implement sanitization on the server side, so I did it
and started storing strings with `&amp;` instead of the literal character `&` in
the database. However, this created a classic double-escaping problem. Because
React also escapes output, the `&amp;` I was carefully storing in the database
was rendered literally on the screen as `&amp;`. The browser never turned it
back into an `&`.

Every online guide and AI assistant suggested the same thing: "Only sanitize on
output"! But I couldn't do that; the security team's requirement to sanitize on
ingest was non-negotiable.

And the interesting idea landed in my head: Why, in **2025**, am I still using
[character entities](https://grokipedia.com/page/Character_encodings_in_HTML#character-references)
instead of _raw Unicode characters_?

For simplicity, I'll provide a list for comparison (not all of them have to be
used):

| Character entity | Unicode symbol | Security critical |
| :--------------- | :------------- | :---------------: |
| `&hellip;`       | `…`            |                   |
| `&mdash;`        | `—`            |                   |
| `&ndash;`        | `–`            |                   |
| `&laquo;`        | `«`            |                   |
| `&ldquo;`        | `“`            |                   |
| `&lsquo;`        | `‘`            |                   |
| `&raquo;`        | `»`            |                   |
| `&rdquo;`        | `”`            |                   |
| `&rsquo;`        | `’`            |                   |
| `&amp;`          | `＆`           |        ✅         |
| `&lt;`           | `＜`           |        ✅         |
| `&gt;`           | `＞`           |        ✅         |

The goal was reached --- the database now contained only _safe_ symbols, and the
UI represented them nicely. But at what price? I asked.

**Fun fact**: Single UTF symbol requires less space compared with 3+ ASCII
symbols in utf encoding.

## Trade-offs of Unicode substitution

- First, legacy systems: If a system still uses KOI8-R and similar, this isn't
  for it (legacy email clients, for example). Legacy fate.
- This approach has to work consistently across the entire backend.
  - Any tech decision has to work consistently, isn't it?
- Database content isn't pure user input, but is it a real problem?
  - You'll need to migrate old data, ✅
  - I have to write
    `SELECT * FROM somewhere WHERE data = "some data＆another data"`, which
    could be an issue only for analytical purposes 🤔
    - Anyway, I'll set up a custom tokenizer in Typesense/Elasticsearch.
  - But it's already prepared to be exported into CSV without additional
    escaping (as a joke).
- I'm not a mobile dev, and I don't have mobile apps yet --- I'll see (use
  proper encoding and modern fonts, not from the dinosaur era 🤷).
- Probably the most underrated point: This process is more like _data
  transformation_ than _sanitization_.

## Verdict: elegant under real constraints

So, is this an ugly hack or an elegant solution?

I count it as an elegant trade-off. In a perfect world, I would only sanitize on
output. But I don't operate in a perfect world; (un)fortunately I operate with
real-world constraints.
