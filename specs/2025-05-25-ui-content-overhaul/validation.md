# Validation — UI & Content Overhaul (Phase 6)

## Build Validation

- [ ] `npm run build` completes with **0 errors**
- [ ] `npm run preview` serves the site at `localhost:4321` without console errors

---

## Visual Validation (Manual)

### Theme
- [ ] Background is light off-white (`#fbfbfd`), not black
- [ ] All text is dark (`#1d1d1f` primary, `#6e6e73` muted)
- [ ] Glass panels are frosted white, not frosted black
- [ ] 3D background renders as subtle grey wireframe (barely visible)
- [ ] Tables use light styling (grey header, white rows, subtle borders)
- [ ] PDF embeds use light panel styling
- [ ] Accent color is Apple blue (`#0071e3`)

### Centrality Table
- [ ] The table in "Data Presentation" is contained within a **scrollable box** (~400px max height)
- [ ] The table header (`<thead>`) stays **sticky** at the top while scrolling
- [ ] All 194 rows are accessible by scrolling

### Interactive Graph
- [ ] Section appears between Hero and Data Presentation
- [ ] Graph renders on canvas with 194 nodes and 214 directed edges
- [ ] Nodes are colored by `type1` (3 distinct colors)
- [ ] Tooltip appears on hover showing node ID, type1, type2
- [ ] Nodes are draggable
- [ ] Mouse wheel zooms in/out
- [ ] Click on a node highlights its direct connections (edges + neighbors)
- [ ] Filter buttons for `type1` categories work (show/hide node types)
- [ ] Legend is visible within the section

### Interpretation Sections
- [ ] **Data Presentation**: 4 interpretation blocks visible (after exploratory stats, degree distribution, top betweenness, centrality table)
- [ ] **ERGM Models**: interpretation blocks after model selection, coefficients, GoF, MCMC diagnostics + ERGM Glossary subsection
- [ ] **Latent Variables Models**: section title reads "Latent Variables Models" (not "Latent Space & Block Models"), interpretation blocks after DLSM selection, latent positions, SBM tables, SBM plot
- [ ] All interpretation text is in **English**
- [ ] Each interpretation block has a consistent style (🔬 icon, accent border)

### ERGM Enhancements
- [ ] Model Selection table has an extra **"Formula"** column showing the model's terms
- [ ] ERGM Feature Glossary subsection is present with definitions for: `edges`, `nodematch`, `nodefactor`, `gwidegree`, `gwesp`
- [ ] MCMC diagnostics PDF is embedded and visible

---

## Merge Criteria

All the above checkboxes must pass before merging `feature/ui-implementation` into `main`.
