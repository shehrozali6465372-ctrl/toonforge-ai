# ToonForge AI — Project Context & Development Order

**Last updated:** 18 November 2026 (five-stage execution plan adopted)  
**Project name:** ToonForge AI  
**Library folder:** `/ToonForge AI`  
**Architecture document:** `ARCHITECTURE.md`  
**Project status:** Planning and feasibility validation; implementation/deployment not started.

---

## 1. Project objective

Build a browser-first system that turns a user idea into an original, family-friendly stylized 3D cartoon video of approximately 1–3 minutes.

Target workflow:

**Idea / Prompt → Story → Scene Plan → Characters & Assets → Animation → Audio → Scene Assembly → Rendering → Quality Control → Final Video**

“Pixar-like” is a broad visual direction only: polished stylized 3D, expressive characters, appealing materials and cinematic lighting. Do not copy protected characters, studio-specific designs, or unlicensed assets.

## 2. Selected foundation and proposed infrastructure

- **Candidate editor foundation:** `rodolphe37/my-motion-studio` (MIT-licensed, browser-based 2D/3D motion editor).
- **Frontend technologies observed:** React 19, TypeScript, Vite, Three.js, React Three Fiber and Zustand.
- **Hosting target:** Render Free Static Site, subject to approval and feasibility.
- **Automation client:** Remote Desktop Commander (RDC), using headless Chromium + Puppeteer.
- **Rendering location:** Browser/client device, not Render.
- **Budget target:** $0 prototype; no paid APIs or infrastructure without explicit approval.

The My Motion Studio repository is a candidate foundation/editor, not a completed prompt-to-video generator. Story planning, asset orchestration, automated scene compilation and end-to-end production still need implementation.

## 3. Verified baseline

### Verified
- My Motion Studio public repository metadata and selected core files were inspected.
- Its codebase uses a React/TypeScript/Vite/Three.js-oriented browser architecture.
- Existing editor code includes a 3D canvas and scene/object editing capabilities.
- Existing export code was observed using browser-side capture/MediaRecorder concepts.
- RDC device was discovered and headless Chromium was launched with Puppeteer.
- RDC Chromium successfully navigated to `https://example.com`, returned HTTP 200, and inspected page title, URL and DOM text.

### Not yet verified
- My Motion Studio itself has not yet been proven to load correctly in RDC Chromium.
- WebGL/WebGL2 availability and renderer type on RDC are not yet verified.
- Hardware acceleration is not verified; prior device inspection found no dedicated GPU and a headless ARM64 Linux environment.
- Actual video export in RDC is not verified.
- MP4/MOV support is not verified. Do not infer support from UI options; test actual MediaRecorder MIME support and output.
- 1–3 minute rendering performance is not verified.
- Prompt-to-video automation has not been implemented.
- No project repository/fork has been created and no Render service/site has been deployed.

## 4. Project execution plan — five mandatory stages

The project will be delivered through exactly **five top-level stages**. The former 18-stage roadmap is retired as the top-level plan; its engineering work is consolidated under these five gates. Do not treat the five stages as five individual tasks: each stage may contain multiple work blocks, and each stage must pass its exit criteria before the next stage begins.

### Stage 1 — Backend ready
Scope:
- Complete the source-code and architecture audit of the selected editor foundation.
- Import/integrate the approved foundation into the existing ToonForge AI repository without losing upstream license and attribution.
- Implement and verify the backend/domain foundation required by the product: project model, scene/story schemas, validation, orchestration contracts, persistence boundaries, provider adapters and error handling.
- Establish reproducible dependency installation, configuration validation, typecheck, lint, unit/integration tests and production build.
- Verify security boundaries: secrets remain server-side, generated model output is schema-validated, and generated code is never executed.
- Document the backend API contracts, data flow, known limitations and test evidence.

**Exit gate:** backend code is integrated, builds reproducibly, critical tests pass, interfaces/contracts are documented, and no unresolved blocker prevents deployment preparation.

### Stage 2 — Deployment ready
Scope:
- Prepare the deployable application and production build configuration.
- Verify environment-variable requirements, build command, publish/output directory, routing and static/server hosting requirements.
- Configure only the approved GitHub repository and approved Render account/workspace.
- Create the single ToonForge AI Render service only after source and build verification; keep the plan free where available.
- Deploy and verify the hosted application, HTTPS, health/readiness behavior where applicable, logs and rollback/recovery procedure.
- Do not mistake static hosting for GPU rendering or long-running video rendering; rendering remains on a verified client/browser unless a separately approved architecture changes this.

**Exit gate:** the correct application is deployed from the approved repository, the live URL is reachable and verified, and deployment/recovery steps are documented.

### Stage 3 — RDC connections ready
Scope:
- Verify the approved RDC device connection and project-only access boundary.
- Configure the project-specific browser/runtime connection to the deployed ToonForge AI application.
- Verify Chromium launch, application load, authentication/session handling if applicable, browser console/network health, and required WebGL/WebGL2 capability.
- Verify the target editor initializes and a small 3D scene can render on the intended client.
- Verify media capture/export capability with a short deterministic test, including actual MIME type, file integrity, dimensions, duration and playback.
- Measure device limits before attempting longer renders; reuse already completed basic Chromium connectivity evidence rather than repeating it without reason.

**Exit gate:** RDC can reliably reach and operate the deployed app, the 3D runtime is proven on the target client, and the required browser capture path is verified with real output.

### Stage 4 — Automation ready
Scope:
- Complete the prompt-to-story and duration-aware story planning workflow.
- Convert validated stories into scene/shot manifests with timing, camera, assets, animation and audio instructions.
- Implement character, environment and prop asset resolution with provenance/license tracking.
- Implement the typed scene compiler/adapter that maps validated manifests into the editor's real internal model.
- Implement animation, voice/audio synchronization, scene assembly and rendering orchestration to the extent supported by verified assets and runtime capabilities.
- Add stage progress, bounded retries, idempotency, checkpoints and resume-from-failure behavior.
- Automate the full workflow through RDC using stable application interfaces/DOM selectors rather than brittle coordinate-only automation.
- Verify repeatable test projects and ensure automation never publishes or uploads user videos without explicit approval.

**Exit gate:** a known prompt can run through the automated pipeline to a locally/exported video artifact, with resumable failures and deterministic validation evidence.

### Stage 5 — Production ready
Scope:
- Complete end-to-end quality control for missing assets, failed scenes, black/frozen frames, audio silence/misalignment, duration mismatch and corrupt/incomplete exports.
- Verify output quality, file integrity, supported formats, runtime, memory use and repeatability against explicit acceptance criteria.
- Complete security, dependency, license, privacy and asset-provenance reviews.
- Run regression, failure-recovery, load/performance and end-to-end acceptance tests on the actual target environment.
- Document operational procedures, known limitations, monitoring/logging, backup/recovery and release process.
- Resolve all release-blocking defects and record evidence for every production-readiness claim.

**Exit gate:** all agreed acceptance criteria pass on the intended environment, critical defects are closed, recovery/operations are documented, and the user explicitly approves any public release or publishing action.

### Stage sequencing rules
1. Work on one stage/work block at a time; finish and verify it before moving on.
2. A stage is not complete because code exists or a deployment command succeeded. Its exit gate must pass with direct evidence.
3. Preserve the former 18 work areas as implementation details under these five stages; do not create a second competing roadmap.
4. Reuse prior verified work and tests. Do not repeat completed checks without a specific reason.
5. If a stage exposes a blocker in an earlier stage, return to that stage deliberately, fix it, and re-run only the affected acceptance checks.

## 5. Architecture and implementation rules

1. Audit before implementing. Check whether functionality already exists.
2. Extend My Motion Studio; do not duplicate or recreate working modules unnecessarily.
3. Use versioned, schema-validated scene manifests.
4. Keep planner/model output separate from editor execution; never execute generated code.
5. Prefer deterministic tests and real evidence over mock claims.
6. Use browser/client rendering. Render Free is for static hosting, not GPU rendering or long-running render jobs.
7. Do not assume WebGL hardware acceleration or MP4 support; measure both.
8. Keep asset provenance and license metadata.
9. Do not use paid APIs, paid services or paid infrastructure without explicit approval.
10. Do not create repositories, deploy services, or modify external production resources without explicit approval.
11. Do not publish or upload videos publicly without explicit approval.
12. Update `PROJECT_CONTEXT.md` after meaningful implementation and record exact verified status, tests, commits and next task.
13. Preserve existing work and use incremental changes.
14. Do not claim a stage is complete until its exit criteria and tests pass.

## 6. Key architectural boundaries

- **Render:** static frontend hosting only.
- **RDC:** headless browser automation and test client.
- **Chromium:** runs the web app, WebGL scene and browser media capture.
- **My Motion Studio:** editor foundation, subject to compatibility audit.
- **ToonForge orchestration:** story/scene planning, schema validation, scene compilation, stage coordination and quality control.
- **Storage:** export project bundles and final videos to user-controlled storage; do not rely on ephemeral Render filesystem.

## 7. Risks and fallback decisions

| Risk | Required response |
|---|---|
| RDC WebGL unavailable or software rendering too slow | Use a suitable user-controlled rendering client; keep Render as static host |
| Browser export fails or is unstable | Inspect actual export implementation; choose a tested client-side or separately approved encoder |
| 1–3 minute render exceeds memory/time limits | Reduce resolution/complexity or use a more capable client; do not assume Render Free can solve it |
| No viable free LLM on current host | Keep manual scene-plan workflow and provider abstraction until a genuinely viable option is selected |
| Upstream editor state is difficult to automate | Build and test a typed adapter; avoid fragile UI-only orchestration |
| Asset licensing unclear | Exclude asset until provenance/license is verified |

## 8. Immediate next task

**Continue at Stage 1 using the prior repository inspection.** Finish the remaining source audit and document exact reusable modules, integration points, gaps and risks. Then proceed to Stage 2 and Stage 3 feasibility tests.

Do not restart the project, redo already verified RDC basic-browser test, create a new repository, or deploy Render before the relevant approval and feasibility evidence.

## 9. Current status snapshot

| Work item | Status |
|---|---|
| Project name and Library folder | Done — `/ToonForge AI` |
| Architecture document | Created — `ARCHITECTURE.md` |
| Development order | Defined — 18 stages |
| My Motion Studio initial inspection | Partially done |
| RDC basic headless browser test | Verified |
| Target editor in RDC | Pending |
| WebGL/WebGL2 test | Pending |
| Actual video export test | Pending |
| 1–3 minute performance benchmark | Pending |
| Prompt-to-video pipeline | Not implemented |
| GitHub repository/fork | Not created |
| Render deployment | Not deployed |

**Next action:** complete the remaining source audit, then run the target-app/WebGL/export feasibility tests. Maintain this file as the single project context/handoff source and update it after each meaningful milestone.

---

## 10. Explicit user-approved project scopes and execution boundaries — 18 November 2026

This section records the user's explicit instructions and supersedes any earlier broad or conflicting scope assumptions in this document.

### 10.1 GitHub — strict repository allowlist

**Only authorized repository:** `https://github.com/shehrozali6465372-ctrl/toonforge-ai.git`

- Work only inside `shehrozali6465372-ctrl/toonforge-ai` for all ToonForge GitHub operations.
- The user explicitly approved all necessary scopes for this one repository.
- Verified GitHub permissions on 18 November 2026: `admin=true`, `push=true`, `pull=true`, `maintain=true`; repository is public and currently reports default branch `main`.
- Do not inspect, read, write, clone, configure, or otherwise touch any other GitHub repository as part of this project.
- Do not interpret “all scopes” as permission to access unrelated repositories, organizations, secrets, or account settings.
- Preserve the repository's existing content and history. Before writes, inspect the target repository state and avoid overwriting existing work.

### 10.2 Render — strict account, workspace, and service boundary

**Only authorized Render account connection:** `3rd render 3500`  
**Only authorized workspace:** `My Workspace`  
**Workspace ID:** `tea-db8u854s728c73b3pr60`

- The user explicitly approved all necessary Render scopes only for this ToonForge AI project and the named workspace.
- Create exactly the ToonForge AI service after its source code is ready and verified in the authorized GitHub repository.
- Intended service: `toonforge-ai`, a Static Site if the verified application is a static Vite frontend; confirm the actual build command and publish directory from the repository before creation.
- Do not create the service prematurely while the repository is empty or the branch/build configuration is unverified.
- Do not inspect, modify, restart, redeploy, delete, rename, or change settings/secrets for any existing Render service or any other resource. In particular, do not touch the existing Binance announcement worker or Pinterest service.
- Do not use the other connected Render accounts (`Render` or `Atoz product hub website`) for this project.
- Once the service is created, its permitted scope is limited to the single ToonForge AI service: configure, deploy, inspect logs/events, and verify its live URL. Do not touch any other service/resource.
- Keep the plan free where available. Do not incur paid costs or upgrade plans without separate explicit approval.

### 10.3 Remote Desktop Commander — project-only machine operations

**Verified device:** `localhost`  
**Device ID:** `bd830869-fbae-4825-ae7b-5044d6161090`  
**Last verified online:** 18 November 2026

- The user explicitly approved all necessary RDC scopes for work related only to ToonForge AI.
- Use RDC only for ToonForge-specific source checkout, project files, dependencies, builds, tests, browser automation, logs, and project documentation.
- Work in a clearly isolated ToonForge project directory. Before creating or modifying files, verify the exact target path.
- Do not inspect, modify, delete, stop, or otherwise interfere with unrelated projects, files, processes, credentials, or services on the device.
- Do not perform broad filesystem cleanup or machine-wide configuration changes.

### 10.4 Required execution sequence

1. Inspect the exact upstream My Motion Studio repository and its license/source structure. Do not inspect unrelated repositories.
2. Import/fork the source into the authorized `toonforge-ai` repository while preserving upstream attribution, license, and history where feasible. Do not replace or destroy existing repository content.
3. Verify the imported code in the authorized repository: inspect the complete source structure, dependencies, build scripts, tests, typecheck, lint, security/license concerns, editor behavior, and export implementation.
4. Run project-local tests/builds and the My Motion Studio browser/WebGL/MediaRecorder feasibility checks through the authorized RDC device.
5. Fix only verified project defects and document changes and test evidence in the project context.
6. Only after code is ready and verification passes, create the separate `toonforge-ai` Render Static Site in the authorized `3rd render 3500 / My Workspace` workspace.
7. Verify the Render service and deployed URL without touching any other Render resource.

### 10.5 Approval interpretation and safety controls

- The user's “Approved all scopes” authorizes the project-specific operations described above within the explicit allowlists. It is not blanket authorization for unrelated repositories, services, accounts, projects, or machine resources.
- No production publishing, external content posting, paid infrastructure, paid API subscriptions, or unrelated account changes are authorized by this scope approval.
- Never claim an import, commit, build, test, deployment, or verification succeeded without direct tool evidence.
- If an operation would cross an allowlist boundary, stop and ask before proceeding.
- Preserve existing work; inspect before editing; prefer incremental, reversible changes.

### 10.6 Scope verification snapshot — 18 November 2026

| Resource | Verified state | Authorized action boundary |
|---|---|---|
| GitHub `shehrozali6465372-ctrl/toonforge-ai` | Repository exists; admin and push access confirmed; repo size reported 0 KB at last check; no usable `main` branch ref was found by Render create attempt | This repository only |
| Render `3rd render 3500` / `My Workspace` | Workspace confirmed; existing services list was retrieved before scope was clarified | One new ToonForge AI service only, created after code verification |
| RDC `localhost` | Device online; Linux ARM64 container; Node 22.23.1 and Python 3.11.2 available | ToonForge-specific files and processes only |

**Current next action:** continue source inspection and import planning for My Motion Studio, then populate and verify only the authorized `toonforge-ai` repository. Render service creation remains deliberately deferred until the code is ready and verified.

## 10. Mandatory execution rules — 18 November 2026

The canonical engineering and execution protocol is **RULES.md** in this project folder and repository. It is mandatory and supersedes conflicting generic workflow assumptions.

Key user instructions:
- RDC work must never be blind: inspect the exact project state, files, process and task scope before acting.
- Execute one task/work block at a time. Finish it fully before starting another; do not context-switch mid-task.
- After every completed work block, push its changes to the single approved GitHub repository and verify the remote commit before starting the next block.
- Do not duplicate files, features, modules, tests, audits or work. Search existing implementation and prior evidence first.
- Feature upgrades must modify/overwrite the existing implementation in place where appropriate; do not create parallel or duplicate files.
- Work to a senior production-engineering standard across software, creative tooling, 3D modeling, animation and rendering; validate with real evidence.
- GitHub write scope: only `shehrozali6465372-ctrl/toonforge-ai`.
- Render scope: only account `3rd render 3500`, workspace `My Workspace`; create the dedicated service only after code is ready and verified. Do not touch any other Render resource.
- RDC scope: only ToonForge AI project files, commands, processes, builds and tests. Never touch unrelated projects or user data.

### Rules-file checkpoint
- Created `RULES.md` in `/ToonForge AI/RULES.md`.
- Pushed `RULES.md`, `ARCHITECTURE.md`, and `PROJECT_CONTEXT.md` to the approved GitHub repository on `main`.
- Rules commit: `462314f7ce1329a079c5db592fdfd4c17902e255`.
- Architecture commit: `75f34c7860040ea12763f622a542fdc0d11120c1`.
- Context commit: `b79ac424d02ce90a01c82e68b8cb4762126facaf`.
- Remote fetch verification: all three files fetched successfully from `main`.
- Next work block must start by verifying the repository state and then continue the My Motion Studio source audit/import. No Render service creation yet.

---

## 11. Stage 1 continuation checkpoint — 19 November 2026

This checkpoint supersedes stale repository and implementation-status snapshots in Sections 3, 9, 10.6 and the earlier "Next action" statements. It records the state verified during the 19 November continuation. It does not mark Stage 1 complete.

### 11.1 GitHub and local repository state

- Authorized write target remains only `shehrozali6465372-ctrl/toonforge-ai`.
- GitHub `main` HEAD at the start of this audit was `dde87ca86dbd1f2bc5a4eb303b6d63f053bf91a5`; this Stage 1 audit checkpoint was then committed to `main` as `43cadc5b367e9c0b8aca397137b55193a19348e2`.
- The GitHub `main` tree currently contains exactly `PROJECT_CONTEXT.md`, `ARCHITECTURE.md` and `RULES.md`; application source, `README.md`, `package.json`, CI workflow and license are not yet present on GitHub.
- The three local project documents have Git blob IDs identical to their GitHub `main` counterparts. They must not be re-created as duplicate files during import.
- Existing local checkout: `/tmp/toonforge-ai-stage1`.
- Local branch: `stage1-foundation`; HEAD: `161414bc8e7ed45f5fc3e7a278d1759e243e33f4` (upstream My Motion Studio PWA-install commit).
- The local checkout is shallow and its HEAD has no common ancestor with GitHub `main`. The remote `toonforge/main` ref was fetched read-only. GitHub currently has no remote `stage1-foundation` branch.
- Local worktree at this checkpoint: 18 staged paths (770 insertions, 525 deletions), zero unstaged changes. Existing staged work has been preserved; nothing was reset or discarded.
- The staged README rewrite removes substantial upstream bilingual documentation and contributor guidance. Review and preserve useful upstream material rather than accepting that deletion blindly.
- The staged CI change removes the inherited Netlify deploy jobs and retains verification-only CI, consistent with the rule that deployment must wait until Stage 2 approval.
- ToonForge branding is now applied to the imported app shell, English/French landing copy, editor labels, README and PWA manifest/screenshot labels. The upstream editor attribution and MIT license remain intact.

### 11.2 Reusable upstream foundation confirmed

- React 19, TypeScript, Vite 8, React Router, Zustand and i18next provide the application shell and state/UI foundation.
- Konva/react-konva provides the existing 2D canvas.
- Three.js, React Three Fiber and drei provide the existing 3D scene graph, camera, lights, primitives, model loaders and viewport controls.
- `src/lib/types.ts`, `factories.ts`, `store.ts` and `animation.ts` provide the existing project/scene/layer model, constructors, state mutations, undo/redo and keyframe interpolation.
- `src/lib/db.ts` and `useAutoSave.ts` provide Dexie/IndexedDB local persistence and debounced autosave.
- `ExportModal.tsx` contains browser canvas capture and GIF encoding. The editor is a reusable foundation, not a completed prompt-to-video pipeline.
- Upstream MIT license file and copyright notice were preserved in the imported branch; the upstream commit history is retained as a merge parent.

### 11.3 Verified implementation gaps and risks

- No backend/API, LLM provider adapter, story planner, versioned scene-manifest schema, schema validator, deterministic scene compiler, cloud persistence or audio/voice pipeline was found in the inspected application source.
- Project persistence is browser-local IndexedDB only; it is not server-side or cross-device persistence.
- Project JSON import uses `JSON.parse` followed by a TypeScript cast and writes the result to IndexedDB without runtime schema validation.
- Image/model imports read whole files into data URLs; no explicit file-size or content validation boundary was found. Single-file glTF import also needs validation for external buffer/texture URI handling.
- Scene transition configuration is stored and exposed in the UI, but source search found no transition renderer/consumer in preview or export.
- Timeline keyframe dragging calls `updateKeyframe` on every mousemove; that store method snapshots undo history on each update, so one drag can consume the 50-entry history.
- Video export hard-codes `video/mp4`, `video/webm` or `video/quicktime` into MediaRecorder without checking `MediaRecorder.isTypeSupported`. The UI still exposes format choices, but the descriptions now warn that MP4/WebM support is browser-dependent and MOV is not implemented; no ffmpeg.wasm dependency or conversion path is present. Actual browser codec support and output files remain unverified.
- GIF export is frame-by-frame and has no explicit output-size/memory guard for long or high-resolution projects.
- The integration branch corrects the README and English/French landing/editor documentation to distinguish transition settings from rendering and to state that MP4/WebM support is browser-dependent and MOV conversion is not implemented.

### 11.4 Local verification evidence — 19 November 2026

- Existing dependency installation log records `npm ci` completed successfully.
- `npm ls three --depth=0` resolved `three@0.185.1`.
- `npm run full-test`: TypeScript typecheck passed, ESLint passed, and Vitest reported 5 test files / 89 tests passed.
- Initial import-build verification exposed a Workbox/Terser worker-pool issue in this RDC container. It was diagnosed and fixed in the 19 November build-hardening work block; the final clean-install production build now exits with code 0. See Section 12.2.
- Final clean-install build main JavaScript bundle: 1,961.50 kB (561.24 kB gzip); Vite emitted its greater-than-500-kB chunk warning. Track code splitting as a separate optimization task.
- No target-app browser load, WebGL/WebGL2 renderer, MediaRecorder MIME support, real video export or 1–3 minute performance benchmark has been verified yet.
- A verification-only GitHub Actions workflow is now included on `stage1/source-import`; it runs typecheck, lint, tests and build and contains no deployment job. Workflow run status has not yet been verified.

### 11.5 Source import work block status

**Completed 19 November 2026:** the audited editor foundation has been imported into the authorized repository on `stage1/source-import`, preserving the existing project documents and upstream Git history. See Section 12 for the exact remote commit and verification evidence.

**Next task:** begin the typed backend/domain foundation using the imported editor model and the existing project architecture. Do not duplicate the editor store, scene model or renderers. Do not create a Render service or deploy yet.

**Status:** Stage 1 remains in progress; source import and reproducible build/test gates are verified. Backend/domain implementation and browser/WebGL/export feasibility remain open.

---

## 12. Stage 1 source import checkpoint — 19 November 2026

### 12.1 GitHub integration result

- Authorized repository: `shehrozali6465372-ctrl/toonforge-ai` only.
- Integration branch: `stage1/source-import`, created from GitHub `main` at `fcdaf3df50090a3137abe837d9374b03a90c7182`.
- Upstream source revision: `rodolphe37/my-motion-studio` `161414bc8e7ed45f5fc3e7a278d1759e243e33f4`; upstream `main` was verified to point to this exact commit.
- The upstream repository was unshallowed to retain its 46-commit history. The source import is a two-parent merge commit, not a flattened archive.
- Import commit: `c9f12d0d1d1c88095d5aed03ffd5a07aa098e6e3`.
- Merge parents: target project checkpoint `fcdaf3df50090a3137abe837d9374b03a90c7182` and upstream source `161414bc8e7ed45f5fc3e7a278d1759e243e33f4`.
- Push to `toonforge/stage1/source-import` completed successfully; `git ls-remote` verified the remote branch HEAD equals `c9f12d0d1d1c88095d5aed03ffd5a07aa098e6e3`.
- The merge imported 86 paths; the resulting branch tracks 89 files total. `PROJECT_CONTEXT.md`, `ARCHITECTURE.md` and `RULES.md` each occur exactly once. No duplicate project documents were added.
- Imported `LICENSE` Git blob ID matches the upstream source exactly. Upstream `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, README content and copyright attribution were retained.
- The full bilingual README was preserved and edited in place rather than replaced with a shortened duplicate. Unsupported transition/export/offline claims were corrected in README and English/French UI documentation. PWA manifest branding now identifies ToonForge AI.
- The imported GitHub Actions workflow is verification-only (typecheck, lint, test, build); it has no deployment steps. No Render service was created and no deployment was run.

### 12.2 Integration verification and build hardening — 19 November 2026

- Root cause: this RDC Linux ARM64 container reports `os.cpus().length === 0` while `os.availableParallelism() === 8`. The installed transitive `@rollup/plugin-terser@1.0.0` used `os.cpus().length` as its default worker limit. Workbox production service-worker minification therefore created a zero-worker pool and left its build task pending.
- Added `scripts/patch-terser-worker-pool.cjs` and a `prebuild` hook (not `postinstall`). The patch is idempotent and version-locked to `@rollup/plugin-terser@1.0.0`; it enforces a minimum of one worker in the package source, ESM distribution and CJS distribution. It fails closed if the dependency version or expected source changes, requiring a deliberate review. Applying it only before builds avoids modifying dependencies during ordinary installs and avoids requiring build-only dependencies for production-only installs. No extra npm dependency was added.
- `package-lock.json` is unchanged from the imported source commit. The workaround is applied only to installed `node_modules`; it does not alter application runtime code or weaken service-worker minification.
- Build-hardening commit: `7b039bd0885ab4e79f390cd66fb6fd315aba873c` (`fix: guard Workbox minifier against zero CPU count`). It was pushed to `stage1/source-import`; `git ls-remote` verified the remote branch HEAD equals this exact commit.
- Clean install using the original lockfile: `npm ci --no-audit --no-fund` exited 0 and installed 644 packages. After switching the patch to `prebuild`, the three installed dependency files were reset to their upstream state and `npm run build` applied the workaround automatically before invoking Vite (`Applied @rollup/plugin-terser 1.0.0 zero-CPU worker fallback.`).
- Final clean-install `npm run full-test`: TypeScript typecheck passed, ESLint passed, 5/5 Vitest files passed, 89/89 tests passed.
- Final `npm run build` with the `prebuild` hook: exited 0. Vite transformed 2,478 modules and reported `built in 17.13s`; Workbox `generateSW` completed and generated `dist/sw.js` (2,046 bytes) and `dist/workbox-2fbc6a65.js` (15,026 bytes). PWA precache: 18 entries, 2,804.85 KiB.
- Non-blocking optimization risk: the main JavaScript bundle is 1,961.50 kB (561.24 kB gzip), triggering Vite's >500 kB chunk warning. Code splitting/performance optimization remains future work; do not suppress the warning without evidence.
- `git diff --check` passed after the code changes.
- Still unverified: target-app browser load, WebGL/WebGL2 renderer, MediaRecorder MIME support, playable video export, audio export and 1–3 minute performance benchmark.

### 12.3 Existing editor/domain inventory — 19 November 2026

- **Reusable editor domain model:** `src/lib/types.ts:1-207` defines `Project`, `Scene`, the discriminated `Layer` union, `Keyframe`, `Transition`, `BackgroundFill` and `ProjectSettings`. This is the canonical editor-state model to target through an adapter. It has no `schemaVersion` and no runtime validation.
- **Existing state/store:** `src/lib/store.ts:25-410` uses Zustand for project selection, scene/layer/keyframe mutations, current time, selection, save status and 50-entry undo/redo. Reuse this store; do not create a parallel editor store or replace its renderer-facing types.
- **Renderers:** `Canvas2D.tsx` uses React-Konva; `Canvas3D.tsx` uses React Three Fiber/Three.js. Both consume the existing scene/layer model. `GroupLayer` and `parentId` exist in the types, but the current renderer dispatch does not render group nodes or apply group transforms.
- **Animation:** `src/lib/animation.ts` provides keyframe lookup, easing and interpolation. New animation cues must compile into the existing supported keyframe/property model or be rejected explicitly; do not assume arbitrary properties are renderable.
- **Persistence:** `src/lib/db.ts:4-27` uses Dexie/IndexedDB database `MotionStudioDB`, schema version 1, with a single `projects` table. It is local-device persistence only; there is no backend repository/API or migration framework. `saveProject` mutates `project.updatedAt` before writing.
- **Import/export:** JSON export uses `downloadJSON`; `ProjectsPage.tsx:44-64` imports by `JSON.parse(...) as Project`, then replaces IDs/timestamps without runtime validation, file-size limits or schema migration. Image and imported-model assets are embedded as data URLs in layer fields.
- **Duplication integrity gap:** `duplicateProject` remaps project, scene, layer and keyframe IDs, but does not remap `parentId` references. Existing tests verify fresh IDs but do not test group hierarchy integrity.
- **Media export gaps:** `ExportModal.tsx:63-213` captures a canvas and uses GIF encoding or `MediaRecorder`. MIME types are hard-coded (`video/mp4`, `video/webm`, `video/quicktime`) without `MediaRecorder.isTypeSupported`; no audio track, voice pipeline, actual output-format validation or duration/integrity verification exists. The export completion path calls `saveProject` without awaiting it; cancellation/recorder-stop behavior also needs a dedicated regression review. These are recorded for the later rendering/export work block, not changed during this domain inventory.
- **Existing tests:** five `src/lib/*.test.ts` suites cover factories, Dexie persistence, Zustand mutations/undo-redo, animation and autosave (89 tests). There are no current tests for untrusted project-file validation, versioned scene manifests, asset provenance, provider orchestration or real browser export.
- **Validation dependencies:** no schema-validation library is declared directly in `package.json`. Do not rely on a transitive `ajv` installation; choose and declare a direct validator only if the schema design requires it.
- **Product-specific modules absent:** repository search and README confirm no prompt/story planner, shot model, character/asset orchestration, provenance catalogue, dialogue/voice/audio track, deterministic scene compiler or end-to-end prompt-to-video workflow exists yet.
- **Deployment/security boundary:** the current target is a static browser application; no backend API exists. Provider interfaces may be defined, but API secrets and authenticated model calls must not be placed in browser code. A real provider call requires an explicitly selected and approved server-side endpoint/hosting design.
- **CI trigger limitation:** `.github/workflows/ci.yml` runs on pushes to `main` and pull requests targeting `main`; pushing `stage1/source-import` alone does not trigger GitHub Actions. The 89-test and production-build evidence in Section 12.2 is local RDC evidence, not a GitHub Actions result.

### 12.4 Versioned domain contracts — 20 November 2026

**Implemented, verified, committed and pushed to GitHub on 20 November 2026.**

- Added direct dependency `zod@4.6.7` in `package.json` and lockfile. Runtime schema validation is isolated in `src/domain/contracts.ts`; it is not wired into the browser editor bundle or provider calls in this work block.
- Added provider-independent `toonforge.story-plan` schema v1.0 and `toonforge.scene-manifest` schema v1.0, with generated JSON Schema exports and inferred TypeScript types.
- Story-plan validation covers strict object shapes, identifier uniqueness, scene-duration totals, referenced characters/locations/scenes, dialogue timing and required narrative beat ordering.
- Scene-manifest validation covers strict shapes, project/scene timing, asset path traversal and kind/format mapping, provenance/license metadata, scene object references, animation cue targets/value shapes/keyframe ordering, dialogue speaker references and audio asset/timing references.
- `getProductionReadinessIssues` reports assets whose provenance is unverified, commercial use is restricted/unknown, or whose license identifier is unknown. This is a readiness gate, not a legal determination or a substitute for license review.
- **Not implemented in this block:** manifest-to-editor compiler/adapter, provider orchestration, persistence/API, browser export/audio changes, or new rendering capabilities. Do not treat a validated manifest as directly renderable by the current editor.
- Existing editor `Project`/Zustand store/renderers remain unchanged. No parallel store, provider secrets, service, deployment, or publishing path was added.

### 12.5 Verification evidence — 20 November 2026

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- Initial parallel/default Vitest run: all existing 89 tests passed, but Vitest could not start the new test file's fork worker (worker startup timeout). This was an execution/pool startup failure, not an assertion failure.
- Resource-safe rerun `npx vitest run --pool=threads --maxWorkers=1`: **6 test files passed, 113/113 tests passed**, including 24 new domain-contract tests.
- `npm run build`: exit 0; Vite transformed 2,478 modules and completed in 23.69s. Workbox generated `dist/sw.js` (2,046 bytes) and `dist/workbox-2fbc6a65.js` (15,026 bytes).
- Existing large-bundle warning remains: main JS 1,961.50 kB (561.24 kB gzip), above the 500 kB advisory threshold. This is a performance optimization item, not a build failure.
- `git diff --check`: exit 0.
- Local branch at verification: `stage1/source-import`, base HEAD `4efe786f6ba54b7eb479b15a8a14954963468135`; upstream branch pointed to the same HEAD before this work block was committed. `main` remained at `fcdaf3df50090a3137abe837d9374b03a90c7182`.
- Commit `d425f6893b74a34574cd1bb365af19ed84e72197` (`feat: add versioned story and scene contracts`) contains `PROJECT_CONTEXT.md`, `package.json`, `package-lock.json`, `src/domain/contracts.ts` and `src/domain/contracts.test.ts`. Push to `toonforge/stage1/source-import` succeeded; the remote branch SHA was verified equal to this commit. GitHub file fetches independently confirmed the context, implementation and test blobs on the remote branch.

### 12.6 Deterministic scene-manifest compiler — 20 November 2026

**Implemented, verified, committed and pushed to GitHub on 20 November 2026.**

- Added `src/domain/scene-manifest-compiler.ts`, a pure compiler boundary accepting unknown manifest input, re-validating it through `SceneManifestSchema`, and compiling into the existing editor `Project`/`Scene`/`Layer`/`Keyframe` model.
- Determinism is explicit: caller supplies a stable millisecond timestamp and an asset-source map. The compiler performs no filesystem, network, provider or database I/O.
- Project resolution, frame rate, title, ID and timestamps map to the existing `Project` model. Scene IDs, order, duration and solid backgrounds map to existing `Scene` objects.
- Each supported manifest object maps to an existing imported `MeshLayer`; transforms and supported opacity material values are retained. The scene camera maps to a `Camera3DLayer`. Camera `shotType` and `storySceneId` are retained in a separate `sceneMetadata` sidecar because the legacy `Scene` type has no fields for them.
- Animation cue seconds, vector/numeric values and snake_case easing names map to existing seconds-based `Keyframe` structures with stable IDs. Duplicate target/property channels and camera/object layer-ID collisions are rejected.
- Asset provenance, kind, path and format are preserved in a separate `assetMetadata` sidecar; the legacy `Project` model has no provenance field. The caller must persist this sidecar separately if provenance must survive reload/export.
- Current supported model source is GLB v2 only, supplied as a `data:model/gltf-binary;base64,` URL. The compiler checks base64 shape, GLB magic, version, declared file length and first JSON chunk header. It does **not** inspect the full GLB JSON for external buffer/image URIs; the upstream packager must verify all resources are embedded before supplying a source.
- Standalone `.gltf` is rejected because external buffer/texture dependency packaging is not implemented. Dialogue/audio cues are rejected because the editor has no voice/audio track or renderer. Material color/roughness/metalness overrides are rejected because the current imported-mesh renderer cannot apply them; opacity is supported.
- This compiler is not yet wired into the UI, import flow, IndexedDB persistence or a backend. No provider call, API secret, new store, renderer, service or deployment was introduced.

### 12.7 Verification evidence — 20 November 2026

- Focused compiler tests: **16/16 passed**.
- Full resource-safe Vitest run `npx vitest run --pool=threads --maxWorkers=1`: **7/7 files passed, 129/129 tests passed** (89 existing editor tests + 24 contract tests + 16 compiler tests).
- `npm run typecheck`: exit 0 after the compiler and tests were added.
- `npm run lint`: exit 0 after the compiler and tests were added.
- `npm run build`: Vite transformed 2,478 modules and reported `built in 22.13s`; Workbox service-worker output remains generated. The existing 1,961.50 kB main bundle / 561.24 kB gzip warning remains; no bundle-size optimization was attempted in this work block.
- `git diff --check`: exit 0 before the context update.
- Compiler implementation commit: `0444a18f276cc1c1ccbaaa897c3b283d13454d0b` (`feat: compile scene manifests into editor projects`). Push to `toonforge/stage1/source-import` succeeded; `git ls-remote` verified the branch SHA equals this commit. GitHub fetches independently verified `PROJECT_CONTEXT.md`, compiler source and compiler tests.

### 12.8 Next work block — secure GLB asset packaging

1. Implement a pure GLB packager/validator that accepts uploaded bytes, verifies the GLB v2 container and JSON chunk, and rejects external buffer/image URI references before producing a data URL for the compiler.
2. Add explicit asset-size limits and malformed/truncated-file tests based on a documented product limit; do not invent a limit without recording its memory/storage rationale.
3. Keep file access and packaging separate from the pure compiler. The compiler should receive only already validated, self-contained data URLs.
4. Design durable persistence for the compiler's `assetMetadata` and `sceneMetadata` sidecars; the existing IndexedDB schema currently persists only `Project`.
5. Keep provider calls and credentials server-side. No Render service or deployment is authorized at this checkpoint.
6. After verification, update this context, commit and push only to `stage1/source-import`; verify the remote SHA and keep `main` unchanged.

**Stage 1 remains in progress; no production readiness or deployment claim is made.**
