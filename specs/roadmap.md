# Roadmap

## Phase 1: Foundation & Setup
- [x] Project specs definition (Mission, Tech Stack, Roadmap)
- [x] Scaffold Astro project in the current directory
- [x] Install React, Tailwind CSS, and R3F dependencies
- [x] Create data processing scripts for converting raw academic data (CSV, GraphML, HTML) into structured JSON assets

## Phase 2: Configuration & Data Processing
- [x] Implement data processing scripts and run them to generate `src/data/*` and `public/assets/*`
- [x] Create `src/config.ts` to manage UI variables, content paths, theme colors, and 3D camera coordinates (`position`, `lookAt`) for each section

## Phase 3: The 3D Knowledge Graph
- [x] Generate mock or real `graph_data.json`
- [x] Implement `KnowledgeGraph.jsx` using `InstancedMesh` and `Segments` for optimal performance
- [x] Set up `useFrame` logic for camera interpolation based on active section state

## Phase 4: UI Components & GSAP Integration
- [x] Build static Astro components (`Hero.astro`, `DataPresentation.astro`, `ErgmModels.astro`, `LatentSpaceModels.astro`)
- [x] Assemble `index.astro` layout with fixed 3D canvas background and scrolling HTML foreground
- [x] Integrate GSAP `ScrollTrigger` to detect sections and dispatch custom events to the React Island

## Phase 5: Polish & Deployment
- [x] Refine typography, spacing, and dark mode terminal aesthetics
- [x] Optimize 60fps performance and bundle size
- [x] Deploy to Vercel

## Phase 6: UI & Content Overhaul ← CURRENT
> Feature spec: `specs/2025-05-25-ui-content-overhaul/`

- [ ] **Theme**: Transition from dark terminal to light Apple-inspired minimalism
- [ ] **Centrality Table**: Wrap in a scrollable box with sticky header
- [ ] **Interactive Graph**: D3-force 2D graph with drag, zoom, tooltips, type filtering, click-highlight (placed after Hero)
- [ ] **Interpretations**: Add English interpretation blocks to Exploratory Stats, ERGM, and Latent Variables sections
- [ ] **ERGM Enhancements**: Model formula column, coefficients interpretation, MCMC diagnostics, Feature Glossary
- [ ] **Latent Variables**: Rename section, add DLSM + SBM interpretations
- [ ] **3D Background**: Update to subtle light-grey wireframe (decorative, kept)
