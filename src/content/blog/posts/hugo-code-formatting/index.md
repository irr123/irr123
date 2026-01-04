---
date: 2025-04-14T19:42:48Z
back_ref: /blog/_index.md
draft: false
title: Hugo static site generator + Prettier code formatter = ❤️
image: "hugo-code-formatting.png"
keywords:
  [
    Hugo,
    Prettier,
    Code Formatting,
    Docker,
    Static Site Generator,
    .prettierrc,
    Hugo Code Formatting,
    Format Hugo Templates,
    Hugo Template Formatting,
    Prettier Docker Setup,
    prettier-plugin-go-template,
    Hugo Prettier Integration,
    Version Control
  ]
---

I like my code nicely formatted, and since I'm using Hugo here 👇, I figured it
was a good idea to finally set it up properly. But I hit a little problem – Hugo
templates aren't _just_ Markdown; they're a mix of YAML/JSON, HTML/CSS/JS, Go's
template syntax. Before I found the real solution, I had actually prepared
myself to fork shurcooL/markdownfmt and add support for Hugo's template syntax
myself.

![Stylized representation of the Hugo logo iconography interacting playfully with the Prettier logo iconography, connected by a minimalist heart symbol made of clean code braces . Flat design illustration, clean lines, Hugo purple...](hugo-code-formatting.png)

Fortunately, the right search query saved me! It led me to a VS Code plugin
called `prettier-plugin-go-template`. At first, it seemed a bit disconnected
from Hugo specifically, right? But here’s the interesting part: since I prefer
using Vim and Makefiles, I dug into what that VS Code plugin was actually using
under the hood. Turns out, it's powered by the Prettier code formatter! 🤯

So here’s how I got it working natively.

## How I got it setup locally

Alright, so I needed to get this running locally first. My main goal here is
**local Hugo code formatting** with Prettier (TODO: write about setting up a CI
check to enforce this later).

Since I really prefer not cluttering my system with a full Node.js/npm
environment just for one tool, I decided to run Prettier using Docker. I grabbed
a community image that bundles it, seemed convenient.

Here’s the Docker command I ended up using:

```bash
docker run --rm -it -v $(PWD)/src:/work \
    --user $(id -u):$(id -g) \
    jauderho/prettier:latest --write \
    ./archetypes ./content ./data ./static/css ./static/html
```

Now, just run that Docker command and watch how it **breaks everything**! 🤣
Okay, maybe not literally _break everything_, but formatters can make _a lot_ of
changes the first time you run them.

**Seriously though, ALWAYS keep your files under version control before running
formatters, especially with `--write`!** You'll thank yourself later if you need
to revert.

Put the following `.prettierrc` file in the root of your project:

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

Once you have the .prettierrc file in place, run the `docker run` again.

## Conclusion

Simple enough, in my opinion. I’m managing it with a Makefile, here is full code
[https://github.com/irr123/irr123](https://github.com/irr123/irr123/blob/main/Makefile#L27).

An added bonus is that Prettier also does a good enough job formatting static
HTML/CSS/JS assets and even handles code blocks within Markdown content pages.
