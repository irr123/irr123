HUGO ?= hugomods/hugo:ci-non-root-0.153.3  # https://hub.docker.com/r/hugomods/hugo/tags
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
	sudo rm -rf $(PWD)/docs $(PWD)/src/resources/_gen
	mv $(PWD)/src/public $(PWD)/docs
	mv $(PWD)/docs/text/ads.txt $(PWD)/docs/ads.txt
	mv $(PWD)/docs/text/llms.txt $(PWD)/docs/llms.txt
	mv $(PWD)/docs/text/robots.txt $(PWD)/docs/robots.txt
	mv $(PWD)/docs/text/site.webmanifest $(PWD)/docs/site.webmanifest
	mv $(PWD)/docs/img/android-chrome-192x192.png $(PWD)/docs/android-chrome-192x192.png
	mv $(PWD)/docs/img/android-chrome-512x512.png $(PWD)/docs/android-chrome-512x512.png
	mv $(PWD)/docs/img/apple-touch-icon.png $(PWD)/docs/apple-touch-icon.png
	mv $(PWD)/docs/img/favicon-16x16.png $(PWD)/docs/favicon-16x16.png
	mv $(PWD)/docs/img/favicon-32x32.png $(PWD)/docs/favicon-32x32.png
	mv $(PWD)/docs/img/favicon.ico $(PWD)/docs/favicon.ico
	npx -y ${PAGEFIND} --site docs

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
		./archetypes ./assets ./content ./data
