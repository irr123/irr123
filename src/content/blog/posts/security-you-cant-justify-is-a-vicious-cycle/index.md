---
date: 2026-07-02T15:03:27Z
back_ref: /blog/_index.md
draft: false
title: Security you can't justify is a vicious cycle
description:
  "Dependabot is on fire, the model yells, the meeting says add TLS. Fine. Is
  this stopping an attacker, or feeding a checklist?"
image: "hero.png"
---

I've already written about [compliance
security]({{< relref "blog/posts/html-sanitization" >}}). Here is the
adversarial round.

Dependabot continuously DDoSes me with a wall of pull requests. `npm audit`
always paints `X high-severity vulnerabilities`. And a devops engineer, now and
then, starts arguing that our microservices, inside one locked-down AWS VPC,
should really talk over TLS.

![a dim bureaucratic engineering review room rendered like a grim technical cathedral. Automated scanner alerts, dependency update cards, CVSS badges, and compliance checklists are stacked like holy relics. In the center is an empty evidence table: no exploit trace, no attacker path, no threat model. A small network diagram of microservices inside a locked-down VPC sits nearby, surrounded by red warning slips and unanswered question marks](hero.png)

Different mouths, one noise: **add more security, now.** Not one of them showed
me an attacker. Not one showed me the threat.

That's the tell. A vulnerability is worth acting on when you can show the code
that exploits it. The red banner, the CVSS score, the "we should really" line:
all claims. Mostly marketing. Security you can't justify becomes theater. Then
it becomes a vicious cycle.

## Talk is cheap. Show me the code.[^torvalds]

A working proof of concept is proof. A severity score is a claim. A scanner
label is a claim. Someone's opinion is a claim. Claims are cheap. You can
generate a thousand a day, no code required. The PoC is the tax that separates
the real from the loud.

Watch a claim meet the tax. A hyped model scanned curl and reported five
_confirmed_ vulnerabilities; after the security team looked, one was
real.[^mythos] The label said confirmed. The code said otherwise.

## Never update dependencies unless it breaks for your users.[^mitchell]

Brainlessly following automated-tool guidance is a security risk. Brainlessly
adding a dependency to your code or infra is a security risk.

Supply chain: attackers force-pushed malicious commits to 75 of 76 tags of the
_official_ Trivy Action and turned it into a credential stealer.[^trivy] That
proof never came from the red banner.

## Conclusion

None of this is anti-tooling. I keep the scanner and the model. The failure is
treating a claim as a verdict: bad tool UI, plus blind obedience to decade-old
compliance checklists.

So I've started to understand the projects that refuse AI contributions.

{data-content="footnotes"}

[^torvalds]:
    Linus Torvalds, linux-kernel mailing list, 25 August 2000.
    <http://lkml.org/lkml/2000/8/25/132>

[^mitchell]:
    Mitchell Hashimoto: "Fork your dependencies, trim them to only your use
    case, never update unless it breaks for your users."
    <https://x.com/mitchellh/status/2057171518027887035>.

[^trivy]:
    Stephen Thoemmes, "Trivy GitHub Actions Supply Chain Compromise", Snyk.
    <https://snyk.io/articles/trivy-github-actions-supply-chain-compromise/>

[^mythos]:
    Daniel Stenberg, "Mythos finds a curl vulnerability", daniel.haxx.se,
    2026-05-11.
    <https://daniel.haxx.se/blog/2026/05/11/mythos-finds-a-curl-vulnerability/>
