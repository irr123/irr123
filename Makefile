HUGO ?= hugomods/hugo:ci-non-root-0.152.2  # https://hub.docker.com/r/hugomods/hugo/tags
PAGEFIND ?= pagefind@v1.4.0                # https://www.npmjs.com/package/pagefind

.PHONY: srv
srv:
	# python3 -m http.server -d $(PWD)/docs
	npx -y ${PAGEFIND} --site docs --serve

.PHONY: build
build:
	# docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${HUGO} build --buildDrafts
	docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${HUGO} --minify --gc --cleanDestinationDir build
	sudo chown -R $$(id -u):$$(id -g) $(PWD)/src/public $(PWD)/src/resources/_gen
	sudo rm -rf $(PWD)/docs/blog $(PWD)/src/resources/_gen
	mv $(PWD)/src/public $(PWD)/docs/blog
	mv $(PWD)/docs/blog/sitemap.xml $(PWD)/docs/sitemap.xml
	rm -rf $(PWD)/docs/pagefind && npx -y ${PAGEFIND} --site docs

.PHONY: hugo_theme
hugo_theme:
	git submodule update --remote --recursive

.PHONY: hugo_add
hugo_add:
	docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${HUGO} new content content/posts/new-post/index.md
	sudo chown -R $(USER):$(USER) $(PWD)/src/content/posts/new-post

.PHONY: fmt
fmt:
	docker run --rm -it -v $(PWD)/src:/work --user $(id -u):$(id -g) jauderho/prettier:latest --write \
		./archetypes ./assets ./content ./data ./static/css ./static/html ./static/js
