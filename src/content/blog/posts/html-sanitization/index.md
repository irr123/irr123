---
date: 2025-09-05T08:13:44Z
back_ref: /blog/_index.md
draft: false
title: "HTML sanitization: the double-encoding trap"
description:
  "Sanitizing HTML on both ingest and output renders literal `&amp;` in the UI.
  Fix: store raw Unicode, sanitize once. Pattern for React, Next.js, NestJS."
image: "sanitization.png"
---

I went through a security audit on a project that wasn't old, but had passed
through several teams. After the first pentest round, the auditors found missing
backend sanitization.

With proof. Quite disappointing.

![data processing pipe](sanitization.png)

> **Warning:** This article is NOT a recommendation to abandon standard HTML
> entity encoding. This method should only be considered by those who fully
> understand the security implications and are facing the exact double-encoding
> problem described here.

## Constraint: sanitize on ingest and output

The security audit gave us two demands:

1. Sanitize all data coming from client to server on server side;
   - _Sanitize on Ingest_: A "defense in depth" strategy. Never trust user input
     and clean it before it touches the database. Classic security requirement.

2. Sanitize all data coming from server to client on client side;
   - _Sanitize on Output_: The modern web development approach. Sanitize data
     for the specific context it's being used in (e.g., HTML, CSS, a URL) at the
     last possible moment. This is considered the most effective way to prevent
     XSS.

Our stack was standard: a few NestJS microservices and a Next.js frontend.
_Sanitize on Output_ is standard React practice. React already protects against
HTML injection by default by escaping rendered output. Disabling that is a major
anti-pattern.

## The double-encoding issue

Server-side sanitization was easy to add. I started storing strings with `&amp;`
instead of the literal character `&` in the database. That created a classic
double-escaping problem. Because React also escapes output, the `&amp;` I was
carefully storing in the database was rendered literally on the screen as
`&amp;`. The browser never turned it back into an `&`.

Every online guide and AI assistant suggested the same thing: "Only sanitize on
output"! But I couldn't do that; the security team's requirement to sanitize on
ingest was non-negotiable.

Then the useful question landed: Why, in **2025**, am I still using
[character entities](https://grokipedia.com/page/Character_encodings_in_HTML#character-references)
instead of _raw Unicode characters_?

Comparison list. Not all of these have to be used:

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

The goal was reached. The database contained only _safe_ symbols, and the UI
rendered them nicely. But at what price?

**Fun fact**: one UTF symbol can take less space than a 3+ character ASCII
entity.

## Trade-offs of Unicode substitution

- Legacy systems: If a system still uses KOI8-R and similar, this isn't for it
  (legacy email clients, for example). Legacy fate.
- This approach has to work consistently across the entire backend.
  - Any tech decision has to work consistently.
- Database content isn't pure user input, but is it a real problem?
  - You'll need to migrate old data, ✅
  - I have to write
    `SELECT * FROM somewhere WHERE data = "some data＆another data"`, which
    could be an issue only for analytical purposes 🤔
    - Anyway, I'll set up a custom tokenizer in Typesense/Elasticsearch.
  - But it's already prepared to be exported into CSV without additional
    escaping (as a joke).
- I'm not a mobile dev, and I don't have mobile apps yet. I'll see (use proper
  encoding and modern fonts, not from the dinosaur era 🤷).
- The underrated point: this process is closer to _data transformation_ than
  _sanitization_.

## Verdict: elegant under real constraints

I count it as an elegant trade-off under a real constraint. Perfect-world advice
says sanitize on output only. My world ships with audit findings, old data, and
production deadlines.
