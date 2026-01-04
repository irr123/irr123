---
date: 2025-10-02T09:12:38Z
back_ref: /blog/_index.md
draft: false
title: Querying documents with LLMs instead of reading them
image: "img.png"
keywords:
  - AI-Assisted Learning
  - Non-Linear Reading
  - LLM
  - Document Analysis
  - Knowledge Extraction
  - Prompt Engineering
  - Future of Reading
  - Technical Documentation
---

Reading a technical doc cover-to-cover is like running a full table scan. A
64-page guide might only have five pages of signal, but you grind through all 64
anyway.

I tried something different on Google’s
[Startup technical guide: AI agents](https://cloud.google.com/resources/content/building-ai-agents?hl=en).
Instead of reading, I queried it. Treat the doc like a database.

This isn’t deep reading. It’s triage.

![LLM → concise insights](img.png)

## The Workflow

_The point_: figure out in minutes if a doc is worth hours. _Two steps_: broad
“indexing” → targeted follow-ups.

### 1. The Indexing Query

Ask the LLM to map the doc. Thesis, sub-arguments, audience, frameworks. Smarter
than a TOC:

> Analyze this document. Identify its primary thesis, its secondary arguments,
> the intended audience, and any specific technical frameworks or code it
> provides. Present this as a structured summary.

A raw output might look like:

{{< details summary="with some rambling" >}}

Based on an analysis of the document, here is a structured summary.

#### Primary Thesis

The central argument of this guide is that for startups to succeed with AI, they
must move beyond simple prototyping to a disciplined, engineering-driven
methodology for building, deploying, and managing production-grade AI agents.
This systematic approach, centered on the Google Cloud ecosystem, enables the
creation of reliable, scalable, and responsible agentic systems, which provides
a significant competitive advantage.

#### Secondary Arguments

...

#### Intended Audience

...

#### Technical Frameworks and Code

- Primary Development Framework: The Agent Development Kit (ADK)
- Operational Implementation: The Agent Starter Pack
- Key Protocols:
  - Agent2Agent (A2A)
  - Model Context Protocol (MCP)
- Recommended Runtime: Vertex AI Agent Engine
- No-Code Alternative: Google Agentspace
- Code Provision: The guide is conceptual and does not provide direct code
  snippets

ADK Samples repository for working code examples.

{{< /details >}}

_Already clear_: this is high-level, conceptual. No code here. That alone saves
time.

### 2. The Targeted Query

Now pull a thread:

> You mentioned "must move beyond simple prototyping to a disciplined,
> engineering-driven methodology for building, deploying, and managing
> production-grade AI agents". Provide a comprehensive list of criteria for what
> "disciplined" and "engineering-driven" mean in this document.

This pins the model to the source and shows if the doc has substance. After a
few rounds, you know if it’s worth a real read.

## Limitations

This works as a filter. It breaks if you trust it blindly.

- **Hallucinations happen.** I once asked about a new database’s WAL protocol.
  The model said ARIES. Wrong -- the paper invented a new one. It only
  _compared_ to ARIES. **Always cross-check.**
- **Nuance dies.** Author’s pacing, careful build, caveats -- gone. Don’t use
  this for philosophy, law, or anything where structure _is_ meaning.
- **Complexity flattens.** A summary makes a hard thing look simple. It’s
  navigation aid, not expertise.

## Conclusion

This isn’t reading. It’s interrogation. Use it to slash through the pile of PDFs
and whitepapers. Then only read the ones that deserve your hours.
