# IAA Prompt Academy v3 — SHIP KIT

This archive contains the **complete source** of the IAA Prompt Academy v3 website
(commit `e5664bb`, the fact-check-corrected version) plus a prebuilt `dist/`.

The previous session could not register the version because its
`mshtools-website_version_manager` tool was faulting. This session's tool should
work — the whole job below is ~5 steps and one tool call.

## Steps

1. Unzip this archive into a working folder, e.g.:
   ```bash
   mkdir -p /mnt/agents/output/iaa-v3 && cd /mnt/agents/output/iaa-v3 && unzip <this-zip>
   ```
   Use the unzipped folder path as `PROJECT_DIR` below.

2. Install dependencies (pick one):
   - Fast (prebuilt modules from the webapp skill):
     ```bash
     cp -r /app/.agents/skills/webapp-building-swarm/scripts/template/node_modules "$PROJECT_DIR/" && cd "$PROJECT_DIR" && npm install
     ```
   - Or plain: `cd "$PROJECT_DIR" && npm install`

3. Build and verify:
   ```bash
   cd "$PROJECT_DIR" && npm run build && ls dist/index.html
   ```
   (A prebuilt `dist/` is included as a reference; rebuild regardless.)

4. Load the ship tool:
   ```
   select_tools(names=["mshtools-website_version_manager"])
   ```

5. Ship:
   ```
   mshtools-website_version_manager(
     action="build_version",
     project_dir="$PROJECT_DIR",
     type="static",
     message="IAA Prompt Academy v3 — fact-check corrections: real 2025 passenger record (10.6M), 183-acre solar farm, KultureCity/Aira/TSA Cares amenities, g0 citation fix, exact Air Canada tribunal quote, new prompt-injection leg"
   )
   ```

6. Present ONLY the URL/version ID the tool returns. Do not invent one.

## What this version is
Prompt-engineering training platform for Indianapolis Airport Authority staff
(React 19 + Vite + Tailwind + shadcn/ui, frontend-only static SPA).
v3 = v2 (rubric/certification/quiz/contrast/perf fixes) + full forensic fact-check
corrections (162 claims audited; all 4 false claims fixed, ~12 imprecisions tightened).
Version lineage: v1 `0bf9ded` → v2 `43a7e85` → **v3 `e5664bb` (this kit)**.
