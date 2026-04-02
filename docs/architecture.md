# StressLab AI — Architecture

## Overview

StressLab AI is an interactive, browser-based pre-print validation workspace for 3D printed parts. It provides approximate stress analysis, live deformation visualization, and multi-agent AI feedback to help designers make better printing decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (apps/web)                                     │
│  ┌───────────┬─────────────────────┬──────────────────┐ │
│  │ Left      │ Viewport            │ Right            │ │
│  │ Panel     │ (React Three Fiber) │ Panel            │ │
│  │           │                     │ (Agent Cards)    │ │
│  │           ├─────────────────────┤                  │ │
│  │           │ Bottom Drawer       │                  │ │
│  │           │ (Chat / Logs)       │                  │ │
│  └───────────┴─────────────────────┴──────────────────┘ │
│            ↕ REST + WebSocket                           │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│  Backend (apps/api) — FastAPI                           │
│  ┌─────────┬──────────────┬───────────┬──────────────┐  │
│  │ CAD     │ Simulation   │ Agent     │ Chat         │  │
│  │ Service │ Service      │ Service   │ Service      │  │
│  └─────────┴──────────────┴───────────┴──────────────┘  │
│            ↕                    ↕                        │
│    ┌──────────────┐    ┌──────────────┐                 │
│    │ Mesh Store   │    │ LLM API      │                 │
│    │ (disk/memory)│    │ (OpenAI)     │                 │
│    └──────────────┘    └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Client-side deformation**: Real-time vertex displacement runs in the browser for 60fps interaction. The backend receives compact state summaries, not raw mesh data.

2. **Deterministic agents**: Material, failure, and synthesis agents are pure functions of simulation state. The LLM is used only for natural language chat, grounded in agent outputs.

3. **Coexistence with MiroFish**: The StressLab code lives in `apps/` and `packages/`, separate from the original MiroFish `frontend/` and `backend/` directories.

## Folder Structure

```
StressLab-AI/
├── apps/
│   ├── web/          # React + TypeScript + Vite frontend
│   └── api/          # Python + FastAPI backend
├── packages/
│   └── shared/       # TypeScript type contracts
├── docs/             # Architecture and progress docs
├── scripts/          # Dev helper scripts
├── frontend/         # [MiroFish] Original Vue frontend
├── backend/          # [MiroFish] Original Flask backend
└── Makefile          # StressLab dev commands
```

## Data Flow

1. User loads STL → parsed client-side into BufferGeometry
2. User pins a region → anchor vertices stored in Zustand
3. User drags force handle → displacement field computed per-frame
4. Stress heatmap updated from displacement gradients × material stiffness
5. State summary sent to backend (debounced) via WebSocket
6. Backend runs agents in parallel → streams results back
7. Agent cards update in right panel
8. Chat queries grounded in agent outputs + simulation state

## Honest Limitations

- Approximate simulation based on geometry heuristics, not certified FEA
- Intended for rapid design exploration and 3D printing decisions
- Confidence varies with geometry complexity
- STL-only in Phase 1; STEP/BREP support is a future milestone
