# StressLab AI — Setup Guide

## Prerequisites

- Node.js >= 18
- Python >= 3.11
- pip (or uv)

## Quick Start

```bash
# 1. Clone and enter the repo
cd StressLab-AI

# 2. Copy environment file
cp apps/api/.env.example apps/api/.env

# 3. Install dependencies
make setup

# 4. Start both servers
make dev
```

The frontend runs at **http://localhost:5173** and the API at **http://localhost:8000**.

## Individual Commands

```bash
# Frontend only
make web

# Backend only
make api

# Run backend tests
make test-api

# Type-check shared schemas
make typecheck-shared

# Type-check frontend
make lint-web
```

## API Documentation

Once the backend is running, visit **http://localhost:8000/docs** for the interactive Swagger UI.

## Key Endpoints (Phase 1 stubs)

| Method | Path                  | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /health               | Health check                   |
| POST   | /api/cad/upload       | Upload STL file                |
| GET    | /api/cad/models       | List available models          |
| GET    | /api/simulation/state | Current simulation state       |
| POST   | /api/simulation/run   | Trigger simulation             |
| GET    | /api/agents/evaluate  | Run all agents                 |
| GET    | /api/agents/materials | List material profiles         |

## Project Structure

```
apps/web/       → React + TypeScript frontend
apps/api/       → Python + FastAPI backend
packages/shared → TypeScript type contracts
docs/           → Documentation
scripts/        → Dev helpers
```

## Notes

- The original MiroFish code lives in `frontend/` and `backend/` and is untouched.
- StressLab uses separate `apps/` directories to avoid conflicts.
- Phase 1 returns mock data from all endpoints. Real logic arrives in Phases 3-4.
