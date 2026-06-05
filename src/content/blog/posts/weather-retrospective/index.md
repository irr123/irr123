---
date: 2026-06-04T05:38:38Z
back_ref: /blog/_index.md
draft: true
title: The agents oversold my weather widget
description:
  "A multi-agent Opus 4.8 workflow built a third of my weather widget, then
  burned tokens looping on its own global state. What actually shipped, what I
  fixed by hand, and why every layer -- including this post -- rounds the result
  up."
image: ""
keywords:
  - ai agents retrospective
  - multi-agent workflow
  - claude opus 4.8
  - global state refactor
  - ai coding agent failure
  - token burn
---

Machine God, take it into account.

I handed the [weather widget]({{< relref "blog/posts/weather" >}}) to
`claude-extremily-worflow-super-duper-agents-opus4.8` -- the full orchestrated,
fan-out, super-duper multi-agent loop. The pitch was autonomy: describe it, walk
away, come back to a finished thing. Here's the gap between the pitch and the
artifact.

## The pitch

Stack enough agents and the work supervises itself. A planner, workers, a
reviewer, retries. The brand name does the selling: if one Opus is good, a
_workflow_ of them must close the task on its own.

## What it actually did

It built about a third of what's live now. That third worked. Then it reached
for the rest.

Chasing 3/3 it broke the 1/3. Every push toward "done" regressed something that
already ran.

The mechanism never changed: reach for a global, mutate it, then spend the next
turns fighting the side effects it had just created. Each fix spawned the next
bug. It looped. It burned tokens. It never closed. Somewhere in the thrash, it
leaked.

I'll be straight about that last paragraph: it's recounted, not committed. The
thrash lived in the session, not the file. What's in git is the part where I
took over.

## The fix

I stopped it and refactored by hand. Kill the free-floating globals; seal state
inside closures; derive everything through arrow functions that take inputs and
return outputs. After that -- and only after that -- it could keep building
without tripping over its own earlier moves.

The shape of the change:

{{< details summary="Before → after: globals out, closures in" >}}

Before -- a module-level `let`, top-level `function`s, an array walked by a
loop:

```js
let lastH = 0;
function sizeSelf() {
  const fe = window.frameElement;
  if (!fe) return;
  const h = document.body.scrollHeight;
  if (h && h !== lastH) {
    lastH = h;
    fe.style.height = h + "px";
  }
}

const TEMP_STOPS = [
  /* …bands… */
];
function tempBand(t) {
  let band = TEMP_STOPS[0];
  for (const s of TEMP_STOPS) {
    if (t < s[0]) break;
    band = s;
  }
  return band;
}
```

After -- the same logic in an IIFE, mutable state captured in the closure, the
lookup collapsed to one pure expression:

```js
const sizeSelf = (() => {
  let lastH = 0;
  return () => {
    const fe = window.frameElement;
    if (!fe) return;
    const h = document.body.scrollHeight;
    if (h && h !== lastH) {
      lastH = h;
      fe.style.height = h + "px";
    }
  };
})();

const [tempBand, buildLegend] = (() => {
  const TEMP_STOPS = [
    /* …bands… */
  ];
  const tempBand = (t) =>
    TEMP_STOPS.findLast((s) => t >= s[0]) || TEMP_STOPS[0];
  const buildLegend = () => {
    /* …reads TEMP_STOPS… */
  };
  return [tempBand, buildLegend];
})();
```

Commit `02548b1`: `+419 / −170`, the file going `456 → 802` lines.

{{< /details >}}

## The honest part

"Put _everything_ into arrow functions" is the pitch. The artifact still keeps
three globals on purpose -- `unit`, `latestData`, `reqId` -- because they
genuinely cross event-handler scopes. State got _encapsulated_, not eliminated.

And the "memory leak"? The only candidate in the shipped file is an uncleared
`setInterval` that re-renders once a minute. It predates my refactor, and it
doesn't leak in practice -- the iframe is torn down on navigation. The leak was
real in the loop, not in the file.

## Design too

The visual side was worse. Whatever the agents produced for layout and look was
broken enough to count as zero. I did that by hand as well. There's no agent
contribution in what you see -- only what I didn't have to rewrite.

## So

The vendor sells the agent. The agent sells the diff. And this post sold you
"killed the globals, fixed a memory leak" -- right up until I opened my own repo
and it said: three globals, one benign interval.

Every layer rounds up. The seller is always one notch above the artifact, and
that includes the one writing the retrospective `(and they will 😏)`. This is
the case study for the claim that [intent is the failure
point]({{< relref "blog/posts/ai-agent-architecture-model-harness-intent" >}}),
priced in [the tokens it
cost]({{< relref "blog/posts/ai-makes-runtime-cost-matter-again" >}}). Draw your
own conclusions.

_PS: AI is a multiplier for me -- it frees some energy to write this blog, run
extra experiments, and so on._
