VERSION ?= hugomods/hugo:ci-non-root-0.146.4

.PHONY: srv
srv:
	python3 -m http.server -d $(PWD)/docs

.PHONY: build
build:
	# docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${VERSION} build --buildDrafts
	docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${VERSION} --minify build
	sudo chown -R $(USER):$(USER) $(PWD)/src/public
	rm -rf $(PWD)/docs/blog
	mv $(PWD)/src/public $(PWD)/docs/blog
	mv $(PWD)/docs/blog/sitemap.xml $(PWD)/docs/sitemap.xml

.PHONY: hugo_theme
hugo_theme:
	git submodule update --remote --recursive

.PHONY: hugo_add
hugo_add:
	docker run --rm --user $(id -u):$(id -g) -v $(PWD)/src:/src ${VERSION} new content content/posts/new-post/index.md
	sudo chown -R $(USER):$(USER) $(PWD)/src/content/posts/new-post

.PHONY: fmt
fmt:
	docker run --rm -it -v $(PWD)/src:/work --user $(id -u):$(id -g) jauderho/prettier:latest --write \
		./archetypes ./assets ./content ./data ./static/css ./static/html ./static/js
