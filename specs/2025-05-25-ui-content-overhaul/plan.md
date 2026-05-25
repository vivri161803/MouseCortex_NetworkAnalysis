# Plan — UI & Content Overhaul (Phase 6)

## Task Group 1: Theme Transition (Light Apple)

1.1. Update CSS theme tokens in `global.css` (background, text, accent, muted colors)
1.2. Update `.glass-panel` class to light frosted glass variant
1.3. Update typography styles (`h1`, `h2`, `h3`, `p`) to use dark text colors
1.4. Update `CsvTable.astro` table styling (light bg, dark text, subtle borders)
1.5. Update `PdfEmbed.astro` panel styling
1.6. Update `config.ts` theme object (graph node/edge colors for light background)
1.7. Update `KnowledgeGraph.jsx` material colors to light grey wireframe
1.8. Add Inter font import in `Layout.astro` `<head>`

---

## Task Group 2: Centrality Table — Scrollable Box

2.1. Add `scrollable` boolean prop to `CsvTable.astro`
2.2. When `scrollable=true`, apply `max-h-[400px] overflow-y-auto` wrapper and `sticky top-0` on `<thead>`
2.3. Update `DataPresentation.astro` to pass `scrollable={true}` for the centrality table

---

## Task Group 3: GraphML Processing & Interactive Graph

3.1. Update `scripts/graphml-to-json.mjs` to parse `mouse_visual.cortex_2.graphml` into enriched JSON (with `type1`, `type2` per node, `weight` per edge)
3.2. Run the script to generate `src/data/graph_data.json` (overwrite existing)
3.3. Install `d3-force` and `d3-zoom` as dependencies
3.4. Create `NetworkGraph.jsx` — React canvas component with D3-force layout, drag, zoom, tooltips, type filter, click-highlight
3.5. Create `InteractiveGraphSection.astro` — new section wrapping `<NetworkGraph client:only="react" />`
3.6. Add `<InteractiveGraphSection />` to `index.astro` between `<Hero />` and `<DataPresentation />`

---

## Task Group 4: Interpretation Components & Content

4.1. Create `InterpretationBlock.astro` — reusable styled panel (🔬 icon, left accent border, light accent bg)
4.2. Update `DataPresentation.astro`:
  - 4.2.1. Add interpretation after `exploratory_stats` table (density, dyads, reciprocity, transitivity, assortativity, centralization)
  - 4.2.2. Add interpretation after `degree_distribution.pdf` (in-degree concentration, out-degree skew)
  - 4.2.3. Add interpretation after `top_betweenness.pdf` (3 bridge neurons)
  - 4.2.4. Add interpretation after `centrality_table.csv` (raw dataset description)
4.3. Update `ErgmModels.astro`:
  - 4.3.1. Add "Formula" column to model selection table (inline data mapping of model → formula string)
  - 4.3.2. Add interpretation after Model Selection table (M6 best, M5 worst ranking)
  - 4.3.3. Add interpretation after Coefficients table (edges, nodematch, gwideg, gwesp odds ratios)
  - 4.3.4. Add interpretation after GoF plot
  - 4.3.5. Add MCMC diagnostics PDF embed + interpretation
  - 4.3.6. Create "ERGM Feature Glossary" subsection (definition list: edges, nodematch, nodefactor, gwidegree, gwesp)
4.4. Update `LatentSpaceModels.astro`:
  - 4.4.1. Rename title to "Latent Variables Models"
  - 4.4.2. Add interpretation after DLSM Model Selection (d=3 wins, biological 3D significance)
  - 4.4.3. Add interpretation after latent position PDFs (social space mapping)
  - 4.4.4. Add interpretation after SBM contingency tables (3 blocks, biological alignment)
  - 4.4.5. Add interpretation after SBM plot (adjacency matrix reorganization)
  - 4.4.6. Add DLSM MCMC diagnostics PDF embed + interpretation

---

## Task Group 5: Index Page Assembly & Cleanup

5.1. Update `index.astro` — insert `<InteractiveGraphSection />`, keep 3D background
5.2. Update scroll trigger section IDs if new sections were added
5.3. Update `scrollStore.ts` to include new section types
5.4. Update `config.ts` camera stops with new section entry

---

## Task Group 6: Roadmap & Documentation Update

6.1. Update `specs/roadmap.md` — add Phase 6, mark Phase 1-5 tasks as complete
6.2. Update `specs/mission.md` — reflect new design aesthetic (Apple-like light minimalism)

---

## Execution Order

```
TG1 (theme) → TG2 (scrollable table) → TG3 (graph) → TG4 (interpretations) → TG5 (assembly) → TG6 (docs)
```

Dependencies:
- TG4 depends on TG1 (InterpretationBlock needs light theme styling)
- TG5 depends on TG3 + TG4 (new sections must exist before page assembly)
- TG6 is last (documentation reflects final state)
