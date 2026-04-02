# StressLab AI — Development Commands
# These commands operate on apps/web and apps/api, not the MiroFish frontend/backend.

.PHONY: setup dev web api test-api lint-web typecheck-shared clean

# ─── Setup ──────────────────────────────────────────────
setup:
	cd apps/web && npm install
	cd packages/shared && npm install
	cd apps/api && pip3 install -r requirements.txt && pip3 install pytest httpx pytest-asyncio

# ─── Development ────────────────────────────────────────
dev:
	@echo "Starting StressLab AI..."
	@echo "  Web: http://localhost:5173"
	@echo "  API: http://localhost:8000"
	@echo "  Docs: http://localhost:8000/docs"
	@trap 'kill 0' EXIT; \
		cd apps/api && python3 -m uvicorn app.main:app --reload --port 8000 & \
		cd apps/web && npm run dev & \
		wait

web:
	cd apps/web && npm run dev

api:
	cd apps/api && python3 -m uvicorn app.main:app --reload --port 8000

# ─── Quality ────────────────────────────────────────────
test-api:
	cd apps/api && python3 -m pytest tests/ -v

lint-web:
	cd apps/web && npx tsc --noEmit

typecheck-shared:
	cd packages/shared && npx tsc --noEmit

# ─── Cleanup ────────────────────────────────────────────
clean:
	rm -rf apps/web/node_modules apps/web/dist
	rm -rf packages/shared/node_modules
	find apps/api -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
