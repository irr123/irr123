HUGO ?= ghcr.io/gohugoio/hugo:v0.162.1 # https://hub.docker.com/r/hugomods/hugo/tags
PAGEFIND ?= pagefind@v1.5.2            # https://www.npmjs.com/package/pagefind

.PHONY: serve
serve:
	# python3 -m http.server -d $(PWD)/docs
	npx -y ${PAGEFIND} --site docs --serve

.PHONY: format
format:
	docker run --rm -it -v $(PWD)/src:/work --user $$(id -u):$$(id -g) jauderho/prettier:latest --write \
		./archetypes ./assets ./content ./data

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

.PHONY: optimize
optimize:
	@stamp=$(PWD)/.optimize.stamp; \
	find $(PWD)/src -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.mp4' \) \
		$$( [ -f "$$stamp" ] && echo "-newer $$stamp" ) | while read -r f; do \
		ext="$${f##*.}"; tmp="$$f.opt.$$ext"; old=$$(stat -f%z "$$f"); \
		case "$$ext" in \
			png) ffmpeg -nostdin -v error -y -i "$$f" -map_metadata -1 -pred mixed -compression_level 100 "$$tmp" || { rm -f "$$tmp"; continue; }; limit=$$old;; \
			jpg|jpeg) ffmpeg -nostdin -v error -y -i "$$f" -map_metadata -1 -q:v 2 "$$tmp" || { rm -f "$$tmp"; continue; }; limit=$$((old * 9 / 10));; \
			mp4) ffmpeg -nostdin -v error -y -i "$$f" -map_metadata -1 -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "$$tmp" || { rm -f "$$tmp"; continue; }; limit=$$((old * 9 / 10));; \
		esac; \
		new=$$(stat -f%z "$$tmp"); \
		if [ "$$new" -lt "$$limit" ]; then mv "$$tmp" "$$f"; echo "opt:  $$f $$old -> $$new"; \
		else rm -f "$$tmp"; echo "keep: $$f ($$old)"; fi; \
	done; \
	touch $(PWD)/.optimize.stamp
