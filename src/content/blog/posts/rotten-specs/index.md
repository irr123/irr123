---
date: 2026-07-25T01:53:56Z
back_ref: /blog/_index.md
draft: false
title: Rotten specs
description:
  "I run spec-driven development without rotten specs while OpenSpec, spec-kit,
  BMAD and Matt Pocock's skills build a knowledge base I never asked for, then
  let it rot."
image: "hero.png"
---

Say spec-driven development out loud and someone answers "spec rot". OpenSpec,
spec-kit and BMAD earned that answer; every one of them builds a knowledge base
I never asked for.

But I run SDD without rotten specs. The fix: stop building a knowledge base on
top of it.

![a cold archive room. A single small blueprint under a desk lamp on a
workbench, dwarfed by tall steel shelves of freshly printed markdown binders
labeled CONTEXT, ADR, DECISIONS, MEMORY. Dust settling on the shelves, no
librarian at the desk](hero.png)

SDD is two steps: write the spec, then build from it. Both steps run against a
context budget, because the _1M_ window is still a marketing number.

## Two steps don't need a local issue tracker

OpenSpec gave me openspec/specs/, then openspec/changes/&lt;name&gt;/ with
proposal.md, design.md, tasks.md and a nested specs/&lt;capability&gt;/spec.md,
then openspec/changes/archive/2025-01-23-&lt;name&gt;/.

Matt Pocock's skills sell the opposite. Marketed as "small, easy to adapt, and
composable", a shot at GSD, BMAD and Spec-Kit for "owning the process". Then
/setup-matt-pocock-skills writes docs/agents/issue-tracker.md and a triage label
vocabulary, /domain-modeling maintains a root CONTEXT.md plus
docs/adr/0001-\*.md, /to-spec publishes .scratch/&lt;feature&gt;/spec.md,
/to-tickets fills .scratch/&lt;feature&gt;/issues/01-\*.md, and /wayfinder lays
a map.md over the pile. Smaller units that build the same knowledge base.

The rest repeat the shape. A constitution, a spec, a plan and a task list per
feature, a memlog. Scott Logic ran spec-kit on one feature and counted 2,577
lines of generated markdown against 689 lines of code, plus 3.5 hours of
review[^scottlogic]. I read that once. The agent reads it every session, long
after the code moved on.

## Nobody owns the memory

Before writing this I deleted about 250MB from `~/.claude`. Memories, plans,
task lists, session leftovers, backups, security logs. Nothing broke. Nothing
noticed.

Count the layers that claimed to remember something for me:

- the harness: projects/&lt;slug&gt;/memory/MEMORY.md and its per-type files,
  plans/, sessions/, history.jsonl, backups/
  - global and per project
- the SDD framework. Constitution, spec, plan, task list, CONTEXT.md, ADRs,
  archive
- rotten AI-written comments in code, describing the shape before the last
  refactor
- mine, and the only ones I edit: AGENTS.md, README.md, my tests, my
  openapi.yaml
- somebody's Jira/Monday/Confluence MCP servers
  - plus the default expectation that `gh` is installed and GitHub Issues is
    where I track work

A lot of places, a lot of writers. Zero owners. One deleter: me.

Where to put a `{` is a `make fmt` question. Nobody needs to search three
trackers, two memory stores and an ADR to answer it.

So, just stop mixing the jobs. One tool, one job is old advice and it holds
here.

## My SDD adds no files to the repo

I run Pi now. Zero bloatware, zero opinions I didn't add myself. My global
[AGENTS.md]({{< relref "blog/posts/ai-agent-architecture-model-harness-intent/#opencode-the-open-source-ai-coding-agent" >}})
is 9 lines: six invariants, two headers and one environment note. Next to it,
[three skills](https://github.com/irr123/lean) I wrote[^lean].

**Research** only reads. It splits a question into angles, sends read-only
sub-agents at the independent ones, returns cited findings and writes nothing.
**Transfer** writes one owner-only Markdown handoff into the temp directory,
secrets redacted, then stops. The handoff carries whatever the session produced:
findings, or the spec. **Apply** takes that handoff, checks its claims against
the current repo, makes the smallest change and runs the repo's own checks.
Durable guidance goes into the instruction files I already keep. No intermediate
artifacts land in the repo.

Past 100+k tokens in a session I do **Transfer** and restart from the handoff.
Same move once the spec is ready: hand off, drop the model a tier (Opus to
Sonnet, Sol to Terra), then **Apply**. The spec crosses one boundary and dies
there.

Even sessions I don't want to keep at all:
`export PI_CODING_AGENT_SESSION_DIR=${TMPDIR%/}/pi-sessions`.

## Conclusion

Stop arguing with a pointless "grilling" session about _marketing strategy_
while trying to ship a local POC.

While models earn more intelligence, your codebase is still the source of truth.
The agent gets a new version every hour. The repo is the one worth investing in.

The software development cycle has been here for decades. LLM marketing tries to
bury it. Rotten specs are the punishment for blind faith in the Machine God.

{data-content="footnotes"}

[^scottlogic]:
    Scott Logic, "Putting Spec Kit through its paces: radical idea or reinvented
    waterfall?", 2025-11-26. 2,577 lines of markdown, 689 loc, 3.5 hrs review
    against 1,000 loc, no markdown, 15 min review.
    <https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html>

[^lean]:
    Not ideal. Three files, my taste, my harness. If you can do it better, don't
    hesitate: open a PR.
