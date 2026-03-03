.PHONY: install check format lint test test-smoke dev stop build clean \
        build-dev deploy-dev rehydrate

# ---------- Setup ----------
# Prerequisites: pnpm and Node.js already installed.
install:
	pnpm install

# ---------- Quality ----------
# Run formatter, linter, and unit tests in one shot (required before committing).
check:
	pnpm format && pnpm lint && pnpm test

format:
	pnpm format

lint:
	pnpm lint

test:
	pnpm test

test-smoke:
	pnpm --filter web test:smoke

# ---------- Run ----------
dev:
	pnpm --filter web dev

stop:
	pkill -f "next dev" 2>/dev/null || true
	pkill -f "next-router-worker" 2>/dev/null || true

# ---------- Build ----------
build:
	pnpm build

# ---------- Docker / Deploy ----------
build-dev:
	scripts/build_image.sh i4g-console dev

deploy-dev: build-dev
	gcloud run deploy i4g-console \
		--image us-central1-docker.pkg.dev/i4g-dev/applications/i4g-console:dev \
		--region us-central1 \
		--project i4g-dev

# ---------- Clean ----------
# Kills any running dev processes and wipes Next.js and pnpm caches.
clean: stop
	rm -rf apps/web/.next apps/web/node_modules/.cache

# ---------- Rehydrate (Copilot session bootstrap) ----------
rehydrate:
	@echo "--- UI Rehydrate ---"
	git status -sb
	@echo "--- Recent changes ---"
	git log --oneline -5 2>/dev/null || true
