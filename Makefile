-include $(PWD)/.env
export

VERSION ?= hugomods/hugo:ci-non-root-0.144.0

.PHONY: srv
srv:
	python3 -m http.server

.PHONY: build
build:
	# docker run -v $(PWD)/blog_dev:/src ${VERSION} build --buildDrafts
	docker run -v $(PWD)/blog_dev:/src ${VERSION} build
	rm -rf $(PWD)/blog
	sudo chown -R $(USER):$(USER) $(PWD)/blog_dev/public
	mv $(PWD)/blog_dev/public $(PWD)/blog

.PHONY: hugo_theme
hugo_theme:
	git submodule update --remote --recursive

.PHONY: hugo_add
hugo_add:
	docker run -v $(PWD)/blog_dev:/src ${VERSION} new content content/posts/new-post/index.md
	sudo chown -R $(USER):$(USER) $(PWD)/blog_dev/content/posts/new-post
