# 88Residences — Claude Code Instructions

Interactive 3D real-estate building viewer. React 19 + Vite, Three.js via React Three Fiber, Redux Toolkit, GSAP, Tailwind + shadcn/ui.

**Read [GEMINI.md](GEMINI.md) for the full architecture reference** — tech stack, directory structure, data flow, and state architecture. It is the single source of truth for how this codebase is laid out; do not duplicate it here.

---

## Skills

Domain skills live in `.claude/skills/` and are auto-discovered — invoke them with the `Skill` tool. **This is the one and only skills folder**; both Claude Code and Gemini read from it. Do not create a second copy under `.agents/`.

| Group | Skills | Use for |
| --- | --- | --- |
| **`r3f-*`** (11) | `r3f-fundamentals`, `r3f-geometry`, `r3f-materials`, `r3f-lighting`, `r3f-textures`, `r3f-animation`, `r3f-loaders`, `r3f-shaders`, `r3f-postprocessing`, `r3f-interaction`, `r3f-physics` | **Prefer these** — this project renders through React Three Fiber, not imperative Three.js |
| **`threejs-*`** (10) | `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-textures`, `threejs-animation`, `threejs-loaders`, `threejs-shaders`, `threejs-postprocessing`, `threejs-interaction` | Raw Three.js APIs, constructor signatures, and math — correct for anything touching `three` directly (disposal, `Object3D` traversal, loaders in `src/utils/preloader.js`) |
| **`gsap-*`** (8) | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-frameworks`, `gsap-performance`, `gsap-utils` | Camera transitions, tooltip and panel animation. Use `gsap-react` for hook-based usage |
| **`sop-compliance-audit`** | — | Auditing the codebase against the rules below |

When a task spans both layers — e.g. a declarative R3F component that must dispose materials imperatively — consult the `r3f-*` skill for structure and the `threejs-*` skill for the API details.

Three.js is pinned at **0.172**; R3F **9.5**; Drei **10.7**. Verify API shapes against these versions, since the skills document r160+ broadly.

---

## Rules — always apply

Enforced standards live in `.agents/rules/`. Read the relevant file before writing code in that area.

| Rule | File | Covers |
| --- | --- | --- |
| Architecture | [.agents/rules/architecture.md](.agents/rules/architecture.md) | Folder structure, container/UI separation, the 3D-features exception |
| Coding Standards | [.agents/rules/coding-standards.md](.agents/rules/coding-standards.md) | kebab-case files, PascalCase components, formatting |
| Component Guidelines | [.agents/rules/component-guidelines.md](.agents/rules/component-guidelines.md) | Three-layer architecture, Golden Rules |
| Hooks | [.agents/rules/hooks-guidelines.md](.agents/rules/hooks-guidelines.md) | No JSX in hooks, return `{ data, handlers }`, one per file |
| State Management | [.agents/rules/state-management.md](.agents/rules/state-management.md) | Redux Toolkit patterns, slice organization |
| Error Handling | [.agents/rules/error-handling.md](.agents/rules/error-handling.md) | Error Boundary, centralized logger, **no raw `console.log`** |
| Performance | [.agents/rules/performance.md](.agents/rules/performance.md) | Memoization, lazy loading, 3D optimizations |
| Security | [.agents/rules/security.md](.agents/rules/security.md) | No XSS, env var management, API protection |
| Styling | [.agents/rules/styling-theming.md](.agents/rules/styling-theming.md) | Design tokens, Tailwind-only, `cn()` utility |
| Testing | [.agents/rules/testing-standards.md](.agents/rules/testing-standards.md) | Vitest, behavior-driven tests, coverage targets |

---

## Workflows — follow for these tasks

Step-by-step procedures in `.agents/workflows/`. Read the file and follow it rather than improvising.

| Task | Workflow |
| --- | --- |
| New pure UI component in `src/components/` | [.agents/workflows/new-component.md](.agents/workflows/new-component.md) |
| New container (smart component) in `src/containers/` | [.agents/workflows/new-container.md](.agents/workflows/new-container.md) |
| New 3D scene feature module in `src/features/` | [.agents/workflows/new-feature.md](.agents/workflows/new-feature.md) |
| New custom hook in `src/hooks/` | [.agents/workflows/new-hook.md](.agents/workflows/new-hook.md) |
| New Redux Toolkit slice | [.agents/workflows/new-store-slice.md](.agents/workflows/new-store-slice.md) |
| Reviewing code or a PR | [.agents/workflows/code-review.md](.agents/workflows/code-review.md) |
| Auditing SOP compliance across the codebase | [.agents/workflows/frontend-architecture.md](.agents/workflows/frontend-architecture.md) |
| Complex multi-step architectural change | [.agents/workflows/orchestrator.md](.agents/workflows/orchestrator.md) |

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (development mode) |
| `npm run staging` / `npm run production` | Dev server against staging / production env |
| `npm run build` | Production build (alias of `build:production`) |
| `npm run build:staging` | Staging build |
| `npm run lint` | ESLint across the repo |
| `npm run preview` | Preview a built bundle |

Node **>=20** is required. Env files are `.env*` and are gitignored — never commit them or echo their contents.

---

## 3D-specific cautions

- **Always dispose** geometries, materials, and textures when a scene object unmounts, and kill GSAP tweens in cleanup — leaks here were a real bug (commit `aceaf09`).
- Large `.glb` models live in `public/models/`; some are gitignored. Do not commit new large binaries without asking.
- Loaders (Draco, KTX2, Basis) are cached through the singleton in `src/utils/preloader.js` — reuse it instead of constructing new loaders.
