#!/usr/bin/env node
// Standalone CLI port of https://tools.simonwillison.net/llm-cliche-highlighter
// Same detection algorithm (pattern list + chain/echo/question/anaphora finders),
// adapted from browser DOM rendering to ANSI terminal output.
//
// Usage:
//   node llm-cliche-highlighter.mjs file.txt
//   cat file.txt | node llm-cliche-highlighter.mjs
//   node llm-cliche-highlighter.mjs --url https://example.com/article
//
// Flags:
//   --json          print raw matches as JSON instead of highlighted text
//   --full          show the whole text, not just windows around hits
//   --url <url>     fetch article text via r.jina.ai reader proxy

import { readFileSync } from 'node:fs';

// ==== impl start (ported verbatim from the page's <script type="module">) ====

const CHAIN_BODY = String.raw`[^,.;:!?\n\u2013\u2014\u2026]*`;
const CHAIN_SEP = String.raw`(?:\s*,\s*(?:and\s+|or\s+)?|\s+(?:and|or)\s+|\s*[;&\u2013\u2014]\s*(?:and\s+|or\s+)?|\s+-{1,2}\s+)`;
const CHAIN_SPLIT = new RegExp(CHAIN_SEP, 'i');

function makeChainFinder(head, headTest, itemLabel) {
  const item = head + CHAIN_BODY;
  const chain = new RegExp(String.raw`\b${item}(?:${CHAIN_SEP}${item})+`, 'gi');
  return function (text) {
    const found = [];
    for (const m of text.matchAll(chain)) {
      let end = m.index + m[0].length;
      while (end > m.index && /\s/.test(text[end - 1])) end -= 1;
      const count = m[0].split(CHAIN_SPLIT).filter(p => headTest.test(p.trim())).length;
      found.push({
        start: m.index,
        end,
        count,
        badge: String(count),
        badgeTitle: count + ' ' + itemLabel + (count === 1 ? '' : 's')
      });
    }
    return found;
  };
}

function makeRegexFinder(re) {
  return function (text) {
    const found = [];
    for (const m of text.matchAll(re)) {
      found.push({ start: m.index, end: m.index + m[0].length });
    }
    return found;
  };
}

function makeEchoFinder({ minGram = 3, minRun = 2 } = {}) {
  const SENT = /[^.!?\n]+[.!?]?/g;
  const grams = (s, n) => {
    const w = s.toLowerCase().match(/[a-z0-9'\u2019-]+/g) || [];
    const out = new Set();
    for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
    return out;
  };
  return function (text) {
    const sents = [];
    for (const m of text.matchAll(SENT)) {
      if ((m[0].match(/\S+/g) || []).length >= 4) {
        sents.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    }
    const found = [];
    let i = 0;
    while (i < sents.length) {
      let j = i;
      let shared = null;
      while (j + 1 < sents.length) {
        if (sents[j + 1].start - sents[j].end > 3) break;
        const a = grams(sents[j].text, minGram);
        const b = grams(sents[j + 1].text, minGram);
        const common = [...a].filter(g => b.has(g));
        if (!common.length) break;
        shared = common.sort((x, y) => y.length - x.length)[0];
        j += 1;
      }
      const run = j - i + 1;
      if (run >= minRun && shared) {
        let end = sents[j].end;
        while (end > sents[i].start && /\s/.test(text[end - 1])) end -= 1;
        found.push({
          start: sents[i].start,
          end,
          count: run,
          badge: String(run),
          badgeTitle: run + ' sentences echoing \u201c' + shared + '\u201d'
        });
        i = j + 1;
      } else {
        i += 1;
      }
    }
    return found;
  };
}

function makeQuestionChainFinder({ minRun = 2 } = {}) {
  const chain = /[^.!?\n]+\?(?:\s+[^.!?\n]+\?)+/g;
  return function (text) {
    const found = [];
    for (const m of text.matchAll(chain)) {
      const count = (m[0].match(/\?/g) || []).length;
      if (count < minRun) continue;
      let start = m.index;
      while (start < m.index + m[0].length && /\s/.test(text[start])) start += 1;
      found.push({
        start,
        end: m.index + m[0].length,
        count,
        badge: String(count),
        badgeTitle: count + ' questions in a row'
      });
    }
    return found;
  };
}

const ANAPHORA_SKIP = /^(?:i|it|the|a|an|this|that|we|you|they|he|she|there|but|and|so|in|as|if|my|his|her|their|its|these|those|for|at|on|of|to|is|was)$/i;
function makeAnaphoraFinder({ minRun = 3 } = {}) {
  const SENT = /[^.!?\n]+[.!?]/g;
  return function (text) {
    const sents = [];
    for (const m of text.matchAll(SENT)) {
      const w = m[0].match(/[A-Za-z'\u2019-]+/);
      if (w) {
        sents.push({
          start: m.index + m[0].indexOf(w[0]),
          end: m.index + m[0].length,
          head: w[0].toLowerCase()
        });
      }
    }
    const found = [];
    let i = 0;
    while (i < sents.length) {
      let j = i;
      while (j + 1 < sents.length && sents[j + 1].head === sents[i].head
             && sents[j + 1].start - sents[j].end < 4) j += 1;
      const run = j - i + 1;
      if (run >= minRun && !ANAPHORA_SKIP.test(sents[i].head)) {
        found.push({
          start: sents[i].start,
          end: sents[j].end,
          count: run,
          badge: String(run),
          badgeTitle: run + ' sentences opening \u201c' + sents[i].head + '\u201d'
        });
        i = j + 1;
      } else i += 1;
    }
    return found;
  };
}

const WIKI_GROUP = 'Signs of AI writing (Wikipedia)';

const patterns = [
  {
    id: 'no-chain',
    name: '\u201cNo X, no Y\u201d chains',
    description: 'Two or more \u201cno \u2026\u201d items in a row, e.g. \u201cNo fluff, no filler, no jargon.\u201d',
    find: makeChainFinder(String.raw`no[-\s]`, /^no[-\s]/i, '\u201cno\u201d item')
  },
  {
    id: 'whole',
    name: '\u201cThat\u2019s the whole \u2026\u201d',
    description: '\u201cThat / this is the whole point, game, thing \u2026\u201d',
    find: makeRegexFinder(/\b(?:that|this)(?:['\u2019]s|\s+(?:is|was))\s+the\s+whole\b(?:\s+\w+)?/gi)
  },
  {
    id: 'did-not-chain',
    name: '\u201cDid not X, did not Y\u201d chains',
    description: 'Two or more \u201cdid not \u2026\u201d or \u201cdidn\u2019t \u2026\u201d items in a row.',
    find: makeChainFinder(String.raw`(?:did\s+not|didn['\u2019]t)\s`, /^(?:did\s+not|didn['\u2019]t)\s/i, '\u201cdid not\u201d item')
  },
  {
    id: 'dont-verb-it',
    name: '\u201cDon\u2019t VERB it \u2026 VERB it\u201d',
    description: '\u201cDon\u2019t call it X. Call it Y.\u201d',
    find: makeRegexFinder(/\b(?:do\s+not|don['\u2019]t)\s+(?:just\s+|simply\s+|merely\s+)?(\w+)(?:\s+(?:of|about|at|on|for|with|to))?\s+it\b[^.!?\n]*?[.!?;,:\u2013\u2014]['"\u201d\u2019]*\s*(?:just\s+|simply\s+|merely\s+)?\1(?:\s+(?:of|about|at|on|for|with|to))?\s+it\b/gi)
  },
  {
    id: 'sit-with',
    name: '\u201cSit with that\u201d',
    description: 'The reflective \u201csit with that / this / it (for a moment)\u201d.',
    find: makeRegexFinder(/\bsit(?:s|ting)?\s+with\s+(?:that|this|it|(?:the|your)\s+(?:discomfort|feelings?|tension|weight|uncertainty|ambiguity|grief|silence|unease))\b(?:\s+for\s+a\s+\w+)?/gi)
  },
  {
    id: 'already-know',
    name: '\u201cYou already know\u201d',
    description: '\u201cYou already know\u201d \u2014 the answer, what to do, or standing alone.',
    find: makeRegexFinder(/\byou\s+already\s+knows?\s+(?:the\s+answer|what|how|why|this|that|it|who|where)\b|\byou\s+already\s+knows?\b(?![ \t]+\w)/gi)
  },
  {
    id: 'is-the-entire',
    name: '\u201cIs the entire \u2026\u201d',
    description: '\u201cX is the entire point / game / business model.\u201d',
    find: makeRegexFinder(/(?:\b(?:is|was|are|were)|['\u2019]s)\s+the\s+entire\b(?:\s+\w+)?/gi)
  },
  {
    id: 'the-entire-is',
    name: '\u201cThe entire \u2026 is\u201d',
    description: '\u201cThe entire point / game / business model is \u2026\u201d',
    find: makeRegexFinder(/\bthe\s+entire\s+[\w'\u2019-]+(?:\s+[\w'\u2019-]+){0,4}?\s+(?:is|was|are|were)\b/gi)
  },
  {
    id: 'is-real',
    name: '\u201cIs real \u2026 and / not\u201d',
    description: '\u201cThe X is real, and / not \u2026\u201d',
    find: makeRegexFinder(/\bis\s+(?:(?:the|a)\s+real\b(?![\s-]+(?:estate|time|life|world|quick)\b)[^.!?\n]*?\b(?:and|not)\s+it\b|real\b(?![\s-]+(?:estate|time|life|world|quick)\b)[^.!?\n]*?\b(?:and|not)\b)/gi)
  },
  {
    id: 'punchline',
    name: '\u201cThe punchline is\u201d',
    description: '\u201cThe punchline is \u2026\u201d, \u201cthe punchline:\u201d, or \u201cthe punchline?\u201d.',
    find: makeRegexFinder(/\bthe\s+punchline(?:\s+(?:is|was|being)\b|\s*[:?])/gi)
  },
  {
    id: 'worth-naming',
    name: '\u201cWorth naming\u201d',
    description: '\u201cThat loss is real and it\u2019s worth naming\u201d, etc.',
    find: makeRegexFinder(/(?:\b(?:is|are|was|were|feels?|felt|seems?|seemed)|['\u2019]s)\s+(?:\w+\s+){0,2}?worth\s+naming\b(?!\s+names\b)|\bworth\s+naming\s*:/gi)
  },
  {
    id: 'not-nothing',
    name: '\u201cThat\u2019s not nothing\u201d',
    description: '\u201cThat is not nothing\u201d / \u201cthat\u2019s not nothing\u201d.',
    find: makeRegexFinder(/\b(?:that|this|it|which)(?:['\u2019]s|\s+(?:is|was))\s+not\s+nothing\b/gi)
  },
  {
    id: 'is-the-whole',
    name: '\u201cIs the whole \u2026\u201d',
    description: 'Any subject + \u201cis the whole point / trick / pitch / idea\u201d.',
    find: makeRegexFinder(/(?:\b(?:is|was|are|were)|['\u2019]s)\s+the\s+whole\b(?:\s+\w+)?|\bhere(?:['\u2019]s|\s+is)\s+the\s+whole\b(?:\s+\w+)?/gi)
  },
  {
    id: 'echo-triad',
    name: 'Echoing sentence runs',
    description: 'Consecutive sentences built on the same repeated skeleton.',
    find: makeEchoFinder({ minGram: 4, minRun: 2 })
  },
  {
    id: 'performative-honesty',
    name: 'Performative honesty',
    description: '\u201cI won\u2019t pretend\u201d, \u201cI\u2019ll be honest\u201d, \u201clet\u2019s be honest\u201d, \u201cto be clear\u201d, \u201cHonestly,\u201d / \u201cLook,\u201d.',
    find: makeRegexFinder(/\bI\s+(?:will\s+not|won['\u2019]t)\s+pretend\b|\b(?:I['\u2019]ll|let['\u2019]s|to)\s+be\s+(?:honest|clear|blunt|real)\b|(?:^|[.!?\u2013\u2014]\s+|\n)(?:Honestly|Look|Truthfully|Frankly)\s*,/gi)
  },
  {
    id: 'thats-the-part',
    name: '\u201cThat\u2019s the part \u2026\u201d',
    description: 'Gesturing at a favoured detail instead of stating it.',
    find: makeRegexFinder(/\b(?:that|this|it)(?:['\u2019]s|\s+(?:is|was))\s+the\s+part\b|\bthe\s+part\s+that\s+(?:makes|made|gets|got|keeps|kept)\s+(?:me|you|us|it)\b|\bmy\s+favou?rite\s+part\s+of\b/gi)
  },
  {
    id: 'the-only-i-trust',
    name: '\u201cThe only X I trust\u201d',
    description: 'The narrowing superlative reveal.',
    find: makeRegexFinder(/\bthe\s+only\s+[\w'\u2019-]+(?:\s+[\w'\u2019-]+){0,2}?\s+(?:I|you|we|it|he|she|they)\s+(?:trust|need|needs|care|want|wants|use|uses|believe)\b|\bthe\s+only\s+[\w'\u2019-]+\s+that\s+(?:matters|counts|works|survives)\b/gi)
  },
  {
    id: 'take-my-word',
    name: '\u201cDon\u2019t take my word for it\u201d',
    description: 'The stock invitation to verify.',
    find: makeRegexFinder(/\b(?:you\s+)?(?:do\s+not|don['\u2019]t)\s+(?:have\s+to\s+)?take\s+my\s+word\s+for\s+(?:it|any\s+of\s+(?:it|this|that))\b/gi)
  },
  {
    id: 'turns-out',
    name: '\u201cTurns out \u2026\u201d',
    description: 'The casual-revelation opener.',
    find: makeRegexFinder(/(?:^|[.!?\u2013\u2014]\s+|\n)Turns\s+out\b|\bit\s+turns\s+out\s+that\b/gi)
  },
  {
    id: 'fits-in-your-head',
    name: '\u201cFits in your head\u201d',
    description: 'Dev-blog boilerplate for simplicity.',
    find: makeRegexFinder(/\b(?:hold|fit|fits|holds|held)\s+(?:it\s+)?in\s+your\s+head\b|\bbatteries[-\s]included\b|\bit\s+just\s+works\b|\bzero[-\s]config(?:uration)?\b|\bsane\s+defaults\b/gi)
  },
  {
    id: 'stacked-questions',
    name: 'Stacked rhetorical questions',
    description: 'Two or more questions fired in a row.',
    find: makeQuestionChainFinder({ minRun: 2 })
  },
  {
    id: 'sentence-anaphora',
    name: 'Repeated sentence openers',
    description: 'Three or more consecutive sentences starting on the same word.',
    find: makeAnaphoraFinder({ minRun: 3 })
  },
  {
    id: 'colon-triple',
    name: 'Colon into a triple',
    description: 'A colon opening onto three or more comma-separated items.',
    find: makeRegexFinder(/:\s+[^.!?;:\n]{2,40},\s+[^.!?;:\n]{2,40},\s+(?:and\s+|or\s+)?[^.!?;:\n]{2,40}(?=[.!?\n])/g)
  },
  {
    id: 'heres-the-twist',
    name: '\u201cHere\u2019s the twist\u201d',
    description: 'The stage-managed reveal.',
    find: makeRegexFinder(/\bhere(?:['\u2019]s|\s+is)\s+(?:the|a|my|one)\s+(?:twist|thing|catch|kicker|rub|problem|first|second|third|next|recent|real|best|worst|surprising|interesting|key|important)\b[\w\s-]{0,20}[:.]/gi)
  },
  {
    id: 'x-is-dead',
    name: '\u201cX is dead\u201d',
    description: 'The obituary headline and its sequel.',
    find: makeRegexFinder(/\b[\w\s]{3,30}\s+(?:is|are)\s+dead\b|\blong\s+live\s+\w+/gi)
  },
  {
    id: 'thats-why-mattered',
    name: '\u201cThat\u2019s why X mattered\u201d',
    description: 'Retroactively assigning significance.',
    find: makeRegexFinder(/\b(?:that|this)(?:['\u2019]s|\s+(?:is|was))\s+why\b[^.!?\n]{0,80}?\b(?:matter(?:s|ed)?|count(?:s|ed)?)\b/gi)
  },
  {
    id: 'stranded-auxiliary',
    name: 'Stranded auxiliary contrast',
    description: 'A clause that lands on a bare auxiliary for the reversal.',
    find: makeRegexFinder(/[;:,]\s+[^.;:!?\n]{2,50}\s(?:did|does|do|was|were|is|are|has|have|had|can|could|would|will)(?:n['\u2019]t)?\s*[.;]|\b(?:Maybe|Perhaps)\s+\w+[^.!?\n]{0,40}\s(?:would|could|might|should|did|had|was|is)(?:n['\u2019]t)?\s+(?:have\s*)?\./g)
  },
  {
    id: 'ai-vocab',
    group: WIKI_GROUP,
    name: 'AI vocabulary words',
    description: '\u201cdelve\u201d, \u201ctapestry\u201d, \u201cmeticulous\u201d, \u201cpivotal\u201d, \u201cintricate\u201d, \u201cinterplay\u201d, \u201cunderscore\u201d, \u201cgarner\u201d, \u201cbolster\u201d, \u201cvibrant\u201d, \u201cbustling\u201d, \u201cmultifaceted\u201d, \u201cseamless\u201d, \u201cever-evolving\u201d.',
    find: makeRegexFinder(/\b(?:delv(?:e|es|ed|ing)|tapestr(?:y|ies)|meticulous(?:ly)?|pivotal|intricate(?:ly)?|intricacies|interplay|underscor(?:e|es|ed|ing)|garner(?:s|ed|ing)?|bolster(?:s|ed|ing)?|vibrant|bustling|multifaceted|seamless(?:ly)?|commendable|ever-evolving)\b/gi)
  },
  {
    id: 'not-just',
    group: WIKI_GROUP,
    name: '\u201cNot just X, but Y\u201d',
    description: 'Negative parallelisms.',
    find: makeRegexFinder(/\bnot\s+(?:just|only|merely|simply)\s+[^.!?\n;]*?\bbut(?:\s+also)?\b|\b(?:it|this|that)(?:['\u2019]s|\s+(?:is|was))\s+not\s+[^.!?\n,;\u2014\u2013]{1,60}[,;\u2014\u2013]\s*(?:it|this|that)(?:['\u2019]s|\s+(?:is|was))\b/gi)
  },
  {
    id: 'note-that',
    group: WIKI_GROUP,
    name: '\u201cIt\u2019s important to note\u201d',
    description: 'Didactic hedging.',
    find: makeRegexFinder(/\bit(?:['\u2019]s|\s+(?:is|was))\s+(?:also\s+)?(?:important|worth|crucial|essential|vital)\s+(?:to\s+(?:note|remember|understand|recognize|mention|pause|consider|ask)|noting|mentioning|remembering|pausing|considering|asking)\b(?:\s+that\b)?|\bit\s+should\s+be\s+noted\b/gi)
  },
  {
    id: 'testament',
    group: WIKI_GROUP,
    name: '\u201cStands as a testament\u201d',
    description: 'Inflating significance instead of saying what happened.',
    find: makeRegexFinder(/\b(?:stand|stands|stood|serve|serves|served|standing|serving)\s+as\s+(?:a|an)\s+(?:\w+\s+)?(?:testament|reminder)\b|\b(?:is|was|are|were|remain|remains)\s+a\s+(?:\w+\s+)?testament\s+to\b/gi)
  },
  {
    id: 'crucial-role',
    group: WIKI_GROUP,
    name: '\u201cPlays a crucial role\u201d',
    description: '\u201cPlays a crucial / pivotal / vital / key / significant role in \u2026\u201d.',
    find: makeRegexFinder(/\bplay(?:s|ed|ing)?\s+(?:a|an)\s+(?:\w+\s+)?(?:crucial|pivotal|vital|key|significant|central|critical|important)\s+role\b/gi)
  },
  {
    id: 'landscape',
    group: WIKI_GROUP,
    name: '\u201cEver-evolving landscape\u201d',
    description: 'Scene-setting boilerplate.',
    find: makeRegexFinder(/\b(?:ever-)?(?:evolving|changing|shifting)\s+landscape\b|\bin\s+today['\u2019]s\s+(?:fast-paced|ever-changing|ever-evolving|digital|modern|competitive)\s+\w+/gi)
  },
  {
    id: 'vague-experts',
    group: WIKI_GROUP,
    name: '\u201cExperts argue\u201d',
    description: 'Vague attribution to unnamed authorities.',
    find: makeRegexFinder(/\b(?:many|some|several|most|numerous)?\s*(?:experts|critics|observers|scholars|analysts|commentators)\s+(?:have\s+|often\s+|widely\s+)?(?:argu(?:e|es|ed)|not(?:e|es|ed)|suggest(?:s|ed)?|believ(?:e|es|ed)|agree[ds]?|contend(?:s|ed)?|observ(?:e|es|ed)|caution(?:s|ed)?|claim(?:s|ed)?|cit(?:e|es|ed)|point(?:s|ed)?\s+out)\b|\bindustry\s+reports?\s+(?:suggest|indicate|show)\w*\b/gi)
  },
  {
    id: 'despite-challenges',
    group: WIKI_GROUP,
    name: '\u201cDespite these challenges\u201d',
    description: 'The boilerplate challenges-and-outlook formula.',
    find: makeRegexFinder(/\bdespite\s+(?:these|those|such|its|their|the|numerous|significant|ongoing)\s+(?:\w+\s+)?challenges\b|\bfac(?:e|es|ed|ing)\s+(?:several|numerous|many|significant|various|a\s+number\s+of)\s+challenges\b|\bchallenges\s+remain\b|\bremains\s+to\s+be\s+seen\b|\b(?:only\s+)?time\s+will\s+tell\b/gi)
  },
  {
    id: 'participle-tail',
    group: WIKI_GROUP,
    name: 'Participle sentence tails',
    description: 'Superficial analysis bolted onto a sentence end.',
    find: makeRegexFinder(/,\s+(?:highlighting|underscoring|emphasizing|showcasing|reflecting|demonstrating|illustrating|signaling|solidifying|cementing|reinforcing|underlining)\s+(?:its|his|her|their|our|the|a|an|how|that|what|both)\b[^.!?\n]*/gi)
  },
  {
    id: 'promo',
    group: WIKI_GROUP,
    name: 'Promotional boilerplate',
    description: 'Travel-brochure tone.',
    find: makeRegexFinder(/\bnestled\s+(?:in|on|among|between|along|at)\b|\bin\s+the\s+heart\s+of\b|\brich\s+(?:cultural\s+|historical\s+)?(?:heritage|history|tapestry)\b|\bhidden\s+gem\b|\bmust-(?:visit|see|try)\b|\bbreathtaking\b|\bboasts?\s+(?:a|an|the)\b|\bstunning\s+(?:views?|scenery|architecture|backdrop)\b/gi)
  },
  {
    id: 'ai-leftovers',
    group: WIKI_GROUP,
    name: 'Chatbot leftovers',
    description: 'Artifacts pasted straight from a chatbot.',
    find: makeRegexFinder(/\bas\s+an\s+ai(?:\s+language)?\s+model\b|\bas\s+of\s+my\s+last\s+(?:update|training)\b|\bknowledge\s+cutoff\b|\bI\s+(?:cannot|can['\u2019]t|do\s+not|don['\u2019]t)\s+(?:browse\s+the\s+internet|access\s+real-?time)\b|contentReference|oaicite|turn0(?:search|news|image)\d*|attributableIndex|utm_source=/gi)
  }
];

const patternsById = Object.fromEntries(patterns.map(p => [p.id, p]));

const CONTEXT_WORDS = 12;

function countWords(s) {
  const m = s.match(/\S+/g);
  return m ? m.length : 0;
}

function expandLeft(text, pos, words) {
  let i = pos;
  let count = 0;
  while (i > 0 && count < words) {
    while (i > 0 && /\s/.test(text[i - 1])) i -= 1;
    if (i === 0) break;
    while (i > 0 && !/\s/.test(text[i - 1])) i -= 1;
    count += 1;
  }
  return i;
}

function expandRight(text, pos, words) {
  let i = pos;
  let count = 0;
  while (i < text.length && count < words) {
    while (i < text.length && /\s/.test(text[i])) i += 1;
    if (i === text.length) break;
    while (i < text.length && !/\s/.test(text[i])) i += 1;
    count += 1;
  }
  return i;
}

function buildWindows(text, regions) {
  const windows = [];
  for (const r of regions) {
    const ws = expandLeft(text, r.start, CONTEXT_WORDS);
    const we = expandRight(text, r.end, CONTEXT_WORDS);
    const last = windows[windows.length - 1];
    if (last && (ws <= last.end || countWords(text.slice(last.end, ws)) === 0)) {
      last.end = Math.max(last.end, we);
      last.regions.push(r);
    } else {
      windows.push({ start: ws, end: we, regions: [r] });
    }
  }
  return windows;
}

function collectMatches(text, enabled) {
  const perPattern = {};
  const raw = [];
  for (const p of patterns) {
    perPattern[p.id] = 0;
    if (!enabled.has(p.id)) continue;
    for (const m of p.find(text)) {
      m.patternId = p.id;
      raw.push(m);
    }
  }
  raw.sort((a, b) => a.start - b.start || b.end - a.end);
  const matches = [];
  for (const m of raw) {
    const last = matches[matches.length - 1];
    if (last && m.start < last.end) continue;
    m.id = matches.length;
    matches.push(m);
    perPattern[m.patternId] += 1;
  }
  return { matches, perPattern };
}

function buildRegions(text, matches) {
  const regions = [];
  for (const m of matches) {
    const [s, e] = sentenceBounds(text, m.start, m.end);
    const last = regions[regions.length - 1];
    if (last && s <= last.end) {
      last.end = Math.max(last.end, e);
      last.matches.push(m);
    } else {
      regions.push({ start: s, end: e, matches: [m] });
    }
  }
  return regions;
}

function sentenceBounds(text, start, end) {
  let s = start;
  while (s > 0) {
    const ch = text[s - 1];
    if (ch === '\n' || ch === '.' || ch === '!' || ch === '?' || ch === '\u2026') break;
    s -= 1;
  }
  while (s < start && /\s/.test(text[s])) s += 1;
  let e = end;
  while (e < text.length) {
    const ch = text[e];
    if (ch === '\n') break;
    e += 1;
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\u2026') {
      while (e < text.length && /["'\u201d\u2019)\]]/.test(text[e])) e += 1;
      break;
    }
  }
  return [s, e];
}

// ==== impl end ====

function snippet(s) {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > 90 ? clean.slice(0, 87) + '\u2026' : clean;
}

const YELLOW_BG = '\x1b[43m\x1b[30m';
const RED_TEXT = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function renderRegions(text, from, to, regions) {
  let out = '';
  let pos = from;
  for (const region of regions) {
    out += text.slice(pos, region.start);
    let p = region.start;
    for (const m of region.matches) {
      out += text.slice(p, m.start);
      out += YELLOW_BG + text.slice(m.start, m.end) + RESET;
      if (m.badge != null) out += RED_TEXT + BOLD + '[' + m.badge + ']' + RESET;
      p = m.end;
    }
    out += text.slice(p, region.end);
    pos = region.end;
  }
  out += text.slice(pos, to);
  return out;
}

function renderOutput(text, regions, onlyHighlights) {
  if (!onlyHighlights || regions.length === 0) {
    return renderRegions(text, 0, text.length, regions);
  }
  const windows = buildWindows(text, regions);
  let out = '';
  let prev = 0;
  for (const w of windows) {
    if (w.start > prev) {
      const n = countWords(text.slice(prev, w.start));
      if (n > 0) out += DIM + `\n\u22ef ${n} word${n === 1 ? '' : 's'} hidden \u22ef\n\n` + RESET;
    }
    out += renderRegions(text, w.start, w.end, w.regions);
    prev = w.end;
  }
  if (prev < text.length) {
    const n = countWords(text.slice(prev, text.length));
    if (n > 0) out += DIM + `\n\u22ef ${n} word${n === 1 ? '' : 's'} hidden \u22ef` + RESET;
  }
  return out;
}

async function readInput(args) {
  const urlIdx = args.indexOf('--url');
  if (urlIdx !== -1) {
    const url = args[urlIdx + 1];
    if (!url) throw new Error('--url requires a value');
    const res = await fetch('https://r.jina.ai/' + url, { headers: { 'X-Return-Format': 'text' } });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching via r.jina.ai');
    return res.text();
  }
  const fileArg = args.find(a => !a.startsWith('--'));
  if (fileArg) return readFileSync(fileArg, 'utf8');
  return readFileSync(0, 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const full = args.includes('--full');

  const text = await readInput(args);
  const enabled = new Set(patterns.map(p => p.id));
  const { matches, perPattern } = collectMatches(text, enabled);
  const regions = buildRegions(text, matches);

  if (asJson) {
    const out = matches.map(m => ({
      pattern: m.patternId,
      name: patternsById[m.patternId].name,
      text: text.slice(m.start, m.end),
      start: m.start,
      end: m.end,
      badgeTitle: m.badgeTitle || null
    }));
    console.log(JSON.stringify({ matches: out, perPattern, stats: {
      matches: matches.length,
      flaggedSentences: regions.length,
      chainItems: matches.reduce((n, m) => n + (m.count || 0), 0)
    } }, null, 2));
    return;
  }

  if (matches.length === 0) {
    console.log('No clich\u00e9s detected.');
    return;
  }

  console.log(renderOutput(text, regions, !full));
  console.log();
  console.log(BOLD + '--- Matches ---' + RESET);
  matches.forEach((m, i) => {
    const p = patternsById[m.patternId];
    const parts = [p.name];
    if (m.badgeTitle) parts.push(m.badgeTitle);
    console.log(`${i + 1}. \u201c${snippet(text.slice(m.start, m.end))}\u201d \u2014 ${parts.join(' \u00b7 ')}`);
  });
  const items = matches.reduce((n, m) => n + (m.count || 0), 0);
  console.log();
  console.log(`${matches.length} match${matches.length === 1 ? '' : 'es'}, ${regions.length} flagged sentence${regions.length === 1 ? '' : 's'}, ${items} chain item${items === 1 ? '' : 's'}`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exitCode = 1;
});
