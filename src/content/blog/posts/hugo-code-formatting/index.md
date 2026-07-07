---
date: 2025-04-14T19:42:48Z
back_ref: /blog/_index.md
draft: false
title: Hugo + Prettier = ❤️
description:
  "Prettier formats Hugo templates if you point it at
  prettier-plugin-go-template. A small Docker setup so neither tool has to live
  on your host."
image: "hugo-code-formatting.png"
---

I wanted this Hugo site formatted without installing Node on my host. Hugo
templates aren't plain Markdown. They mix YAML/JSON, HTML/CSS/JS, and Go
template syntax. Before I found the easy path, I was ready to fork
shurcooL/markdownfmt and add Hugo template support myself.

![Stylized representation of the Hugo logo iconography interacting playfully with the Prettier logo iconography, connected by a minimalist heart symbol made of clean code braces . Flat design illustration, clean lines, Hugo purple...](hugo-code-formatting.png)

The right search query saved me. It led to `prettier-plugin-go-template`. The
name smelled like VS Code, but the plugin is powered by Prettier. I use Vim and
Makefiles, so that was enough.

Here is how I run it in Docker.

## How I got it setup locally

I needed local Hugo formatting with Prettier.

I don't want a full Node.js/npm setup on the host for one formatter. Docker is
enough. I used a community image that bundles Prettier.

The command:

```bash
docker run --rm -it -v $(PWD)/src:/work \
    --user $(id -u):$(id -g) \
    jauderho/prettier:latest --write \
    ./archetypes ./content ./data ./static/css ./static/html
```

Run it once and expect a large diff. Formatters touch a lot on the first pass.

**Keep files under version control before running formatters with `--write`.**
Future me needs a clean revert path.

Put the following `.prettierrc` file in the repo root:

```json
{
  "bracketSpacing": false,
  "printWidth": 80,
  "proseWrap": "always",
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "none",
  "useTabs": false
}
```

With `.prettierrc` in place, run `docker run` again.

## Conclusion

Simple enough. I manage it with a Makefile; full code is here:
[https://github.com/irr123/irr123](https://github.com/irr123/irr123/blob/main/Makefile#L27).

Prettier also formats static HTML/CSS/JS assets well enough and handles code
blocks inside Markdown content pages.
