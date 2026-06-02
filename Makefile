HUGO ?= ghcr.io/gohugoio/hugo:v0.162.1 # https://hub.docker.com/r/hugomods/hugo/tags
PAGEFIND ?= pagefind@v1.5.2            # https://www.npmjs.com/package/pagefind

.PHONY: serve
serve:
	# python3 -m http.server -d $(PWD)/docs
	npx -y ${PAGEFIND} --site docs --serve

.PHONY: build
build:
	# docker run --rm --user $$(id -u):$$(id -g) -e HUGO_CACHEDIR=/tmp/hugo_cache -v $(PWD)/src:/project ${HUGO} build --buildDrafts
	docker run --rm --user $$(id -u):$$(id -g) -e HUGO_CACHEDIR=/tmp/hugo_cache -v $(PWD)/src:/project ${HUGO} build --minify --gc --cleanDestinationDir
	rm -rf $(PWD)/docs $(PWD)/src/resources/_gen
	mv $(PWD)/src/public $(PWD)/docs
	npx -y ${PAGEFIND} --site docs

.PHONY: hugo_add
hugo_add:
	docker run --rm --user $$(id -u):$$(id -g) -v $(PWD)/src:/project ${HUGO} new content content/blog/posts/new-post/index.md

.PHONY: format
format:
	docker run --rm -it -v $(PWD)/src:/work --user $$(id -u):$$(id -g) jauderho/prettier:latest --write \
		./archetypes ./assets ./content ./data
