# Requirements — UI & Content Overhaul (Phase 6)

## Scope

Transform the SAND connectome presentation from a dark-terminal aesthetic into a clean, light, Apple-inspired interface while enriching every section with scientific interpretations, an interactive graph visualization, and a glossary of ERGM terms.

---

## Decisions

### D1 — Target Audience (confirmed)
Professors and researchers. Design shifts from dark/terminal to **light Apple-like minimalism** while retaining the academic rigor.

### D2 — Theme Direction
- **Light mode only** (no dark toggle for now)
- Background: `#fbfbfd` (Apple off-white)
- Text: `#1d1d1f` (near-black)
- Accent: `#0071e3` (Apple blue)
- Glass panels: frosted white (`bg-white/70 backdrop-blur-xl`)
- 3D background remains but transitions to a **subtle light-grey wireframe** (decorative, non-interactive)

### D3 — Interactive Graph (new section)
- Placed immediately **after Hero**, before Data Presentation
- Uses **D3-force** layout rendered on `<canvas>` for performance
- **Advanced interactivity**: drag nodes, zoom, tooltip (node ID + type1 + type2), filter by neuron type, highlight connections on click
- Nodes colored by `type1`: Pyramidal → blue, Cell body → green, Dendritic → grey
- Legend embedded in the section

### D4 — Interpretation Language
- **English** — consistent with the rest of the site
- Source content from `output_interpretation.md` (Italian) will be translated to English

### D5 — 3D Background
- **Kept** as a decorative layer behind the entire site
- Colors updated to light theme (grey nodes, very faint edges)
- No interactivity (as before)

### D6 — Section Rename
- "Latent Space & Block Models" → **"Latent Variables Models"**

---

## Context

### Source Data
- **GraphML file**: `analysis_output/mouse_visual.cortex_2.graphml` (194 nodes, 214 directed edges)
- Node attributes: `type1` (Characterized pyramidal neuron / Cell body in EM volume / Dendritic fragment), `type2` (Postsynaptic excitatory/inhibitory target / NA)
- Edge attribute: `weight`

### Interpretation Content Source
- `analysis_output/interpretation/output_interpretation.md` — full interpretation of every output file
- Sections L8-L29 → Exploratory Statistics
- Sections L32-L66 → ERGM Models
- Sections L70-L98 → SBM + DLSM (Latent Variables)

### Tech Stack (confirmed)
- Astro SSG + React islands
- Tailwind CSS v4
- GSAP + ScrollTrigger
- R3F + Three.js (3D background — kept)
- **New**: D3-force for interactive graph (to be installed)
- Papaparse for CSV parsing (existing)

---

## Constraints

1. The 3D background must not interfere with the interactive 2D graph — the 2D graph is in its own section, not overlapping the 3D canvas
2. The centrality table (194 rows) must be contained in a scrollable box, not expanding the full page
3. ERGM model formulas must be added as an extra column in the existing model selection CSV table
4. All interpretation text must be in English (translated from the Italian source document)
5. No new branches — work continues on `feature/ui-implementation`
