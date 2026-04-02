# StressLab AI — Progress

## Phase 1: Scaffolding (current)

**Status:** In progress

### Completed
- [x] Repository structure: `apps/web`, `apps/api`, `packages/shared`
- [x] Frontend shell: React + TypeScript + Vite + Tailwind
- [x] Layout: TopToolbar, LeftPanel, ViewportPanel, RightPanel, BottomDrawer
- [x] Backend shell: FastAPI with modular routers
- [x] Pydantic models: MaterialProfile, TestScenario, StressFieldSummary, AgentOutput
- [x] Stub API routes: /health, /api/cad/*, /api/simulation/*, /api/agents/*
- [x] Shared TypeScript schemas mirroring backend models
- [x] 6 real material profiles (PLA, PETG, ABS, Nylon, TPU, Resin)
- [x] Documentation: architecture, setup, progress
- [x] Makefile with dev commands

### Not yet done
- [ ] Verify clean install and startup

## Phase 2: Viewport and CAD Workspace (next)

- React Three Fiber integration
- STL loader with sample models
- Camera controls (orbit / pan / zoom)
- Grid, axes, orientation cube
- View modes (shaded / wireframe / stress)
- Zustand stores for viewport and project state
- Material picker wired to state

## Phase 3: Manual Stress Interaction

- Region selection via raycasting + normal clustering
- Pin tool and force handle gizmos
- Client-side deformation engine
- Stress heatmap shader
- Geometry analysis (thin walls, sharp corners)

## Phase 4: Agents

- Backend agent framework
- WebSocket pipeline for live updates
- Material agent cards with real risk scores
- Failure mode and design advisor agents
- Chat grounded in simulation state

## Phase 5: Comparison and Persistence

- Material comparison view
- Save / restore scenarios
- Summary reports

## Phase 6: Optional Advanced Backend

- FreeCAD/OCCT adapter for STEP import
- Enhanced geometry extraction
- Export snapshots
