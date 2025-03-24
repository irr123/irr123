VERSION ?= hugomods/hugo:ci-non-root-0.145.0

.PHONY: srv
srv:
	python3 -m http.server -d $(PWD)/docs

.PHONY: build
build:
	# docker run --rm -v $(PWD)/src:/src ${VERSION} build --buildDrafts
	docker run --rm -v $(PWD)/src:/src ${VERSION} --minify build
	rm -rf $(PWD)/docs/blog
	sudo chown -R $(USER):$(USER) $(PWD)/src/public
	mv $(PWD)/src/public $(PWD)/docs/blog
	mv $(PWD)/docs/blog/sitemap.xml $(PWD)/docs/sitemap.xml

.PHONY: hugo_theme
hugo_theme:
	git submodule update --remote --recursive

.PHONY: hugo_add
hugo_add:
	docker run --rm -v $(PWD)/src:/src ${VERSION} new content content/posts/new-post/index.md
	sudo chown -R $(USER):$(USER) $(PWD)/src/content/posts/new-post
