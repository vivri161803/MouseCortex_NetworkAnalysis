# Roadmap

## Phase 1: Foundation & Setup (Current)
- [x] Project specs definition (Mission, Tech Stack, Roadmap)
- [ ] Scaffold Astro project in the current directory
- [ ] Install React, Tailwind CSS, and R3F dependencies
- [ ] Create data processing scripts for converting raw academic data (CSV, GraphML, HTML) into structured JSON assets

## Phase 2: Configuration & Data Processing
- [ ] Implement data processing scripts and run them to generate `src/data/*` and `public/assets/*`
- [ ] Create `src/config.ts` to manage UI variables, content paths, theme colors, and 3D camera coordinates (`position`, `lookAt`) for each section

## Phase 3: The 3D Knowledge Graph
- [ ] Generate mock or real `graph_data.json`
- [ ] Implement `KnowledgeGraph.jsx` using `InstancedMesh` and `Segments` for optimal performance
- [ ] Set up `useFrame` logic for camera interpolation based on active section state

## Phase 4: UI Components & GSAP Integration
- [ ] Build static Astro components (`Hero.astro`, `Projects.astro`, `Contacts.astro`, etc.)
- [ ] Assemble `index.astro` layout with fixed 3D canvas background and scrolling HTML foreground
- [ ] Integrate GSAP `ScrollTrigger` to detect sections and dispatch custom events to the React Island

## Phase 5: Polish & Deployment
- [ ] Refine typography, spacing, and dark mode terminal aesthetics
- [ ] Optimize 60fps performance and bundle size
- [ ] Deploy to Vercel
