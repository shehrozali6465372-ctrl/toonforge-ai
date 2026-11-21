# ToonForge AI — Project Context & Development Order

**Last updated:** 21 November 2026 (RDC deterministic video-export and streaming verification)
**Project name:** ToonForge AI  
**Library folder:** `/ToonForge AI`  
**Architecture document:** `ARCHITECTURE.md`  
**Project status:** Stage 1 — implementation in progress. Editor source integration, domain contracts/compiler, GLB packaging, manifest persistence and secure Project JSON import are implemented. New 21 November evidence: deterministic timestamped 2D MP4 (H.264) and WebM (VP9) exports now match the 2D project timeline and play back; the large-export streaming target was verified with a mock writable sink. The actual 3D editor still loses its WebGL context under the current SwiftShader runtime, and native File System Access plus target-device hardware validation remain open. Production readiness and deployment remain blocked.

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
- **Automation client:** Remote Desktop Commander (RDC), using headless Chromium and Chrome DevTools Protocol (CDP); no Puppeteer/Playwright dependency is installed.
- **Rendering location:** Browser/client device, not Render.
- **Budget target:** $0 prototype; no paid APIs or infrastructure without explicit approval.

The My Motion Studio repository is a candidate foundation/editor, not a completed prompt-to-video generator. Story planning, asset orchestration, automated scene compilation and end-to-end production still need implementation.

## 3. Verified baseline

### Verified
- My Motion Studio public repository metadata and selected core files were inspected.
- Its codebase uses a React/TypeScript/Vite/Three.js-oriented browser architecture.
- Existing editor code includes a 3D canvas and scene/object editing capabilities.
- Existing export code was observed using browser-side capture/MediaRecorder concepts.
- RDC device was discovered and headless Chromium was driven through CDP; no Puppeteer or Playwright package was installed.
- RDC Chromium successfully navigated to `https://example.com`, returned HTTP 200, and inspected page title, URL and DOM text.

### Not yet verified
- ToonForge Projects and editor routes have been loaded and inspected in RDC Chromium; stable 3D rendering remains unverified (see Section 12.16).
- Minimal WebGL1/WebGL2 creation is now verified under SwiftShader in headless Chromium, but stable 3D editor rendering is not verified because the editor canvas loses its WebGL context after repeated GPU stalls.
- Hardware acceleration is not verified; RDC is a headless ARM64 Linux container with no accessible GPU device nodes.
- Actual 2D MP4 export is verified to complete and play, but its measured duration and codec do not match the UI/timeline contract; see Section 12.16.
- Browser MIME capability is partially verified: generic MP4/WebM and explicit H.264 MIME report supported, QuickTime reports unsupported. The actual generic MP4 output used VP9 (`vp09`), not H.264 (`avc1`). MOV remains unimplemented.
- 1–3 minute rendering performance is not verified.
- Prompt-to-video automation has not been implemented.
- The approved `shehrozali6465372-ctrl/toonforge-ai` repository is populated and active development is on `stage1/source-import`; no Render service/site has been deployed.

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

**Continue Stage 1 with target-browser verification of the completed import workflows.** Use RDC to launch the existing ToonForge application locally (no deployment) and verify the Projects page, versioned/legacy Project JSON import-export, manifest JSON selection, per-asset GLB mapping, validation errors, successful IndexedDB persistence and metadata round-trip. Measure actual browser memory/storage before treating the provisional import caps as production limits.

After import UI verification, continue the Stage 3 feasibility gate: target editor initialization, WebGL/WebGL2 renderer capability, short real video export, supported MIME type/file integrity and a measured 1–3 minute performance benchmark. Do not claim production readiness until these are proven on the intended client.

Do not restart the project, redo already verified RDC basic-browser test, create another repository, or deploy Render before the relevant approval and feasibility evidence.

## 9. Current status snapshot

| Work item | Status |
|---|---|
| Project name and Library folder | Done — `/ToonForge AI` |
| Architecture and five-stage execution plan | Documented |
| My Motion Studio source integration | Integrated into approved ToonForge repository; Stage 1 audit/verification continues |
| Domain contracts and scene-manifest compiler | Implemented and tested |
| GLB validation and packaging | Implemented and tested |
| Manifest import orchestration and IndexedDB metadata sidecar | Implemented, migrated and tested |
| Secure Project JSON import/export | Implemented; legacy and versioned formats validated; sidecar metadata round-trips |
| Controlled scene-manifest import UI | Implemented and pushed; browser verification pending |
| Project JSON import limit | 20 MiB provisional; target-browser memory/storage measurement pending |
| Manifest import limits | 2 MiB JSON / 5 MiB per GLB / 10 MiB total; provisional pending target-browser measurement |
| RDC basic headless browser test | Verified |
| Target editor in RDC | Pending |
| WebGL/WebGL2 test | Pending |
| Actual video export test | Pending |
| 1–3 minute performance benchmark | Pending |
| Prompt-to-video pipeline | Not implemented |
| GitHub repository | Exists; active branch `stage1/source-import` |
| Render deployment | Not deployed |

**Next action:** verify the import workflows in the target browser through RDC, then continue the WebGL/export feasibility gate. Maintain this file as the single project context/handoff source and update it after each meaningful milestone.

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

### 12.8 Secure GLB asset packager — 20 November 2026

**Implemented, verified, committed and pushed to GitHub on 20 November 2026.**

- Added `src/domain/glb-asset-packager.ts`, a pure byte-input validator/packager that accepts `ArrayBuffer` or `Uint8Array` and returns the exact compiler-compatible `data:model/gltf-binary;base64,` URL plus original byte length.
- Validates GLB magic, version 2, declared file length, 4-byte total/chunk alignment, chunk boundaries, JSON-first ordering, exactly one JSON chunk, UTF-8/JSON parsing and `asset.version === "2.0"`.
- Recursively rejects non-data URI references anywhere in the GLB JSON, including buffer, image and nested extension URI fields. Embedded data URIs are accepted. This prevents the imported GLTFLoader from following relative or network asset paths from packaged models.
- Base64 conversion is chunked to avoid spreading a large byte array into one function call. A `Uint8Array` view is copied using its byteOffset/byteLength, not the entire backing buffer.
- No product-wide size cap was invented. `maxBytes` is a required positive safe-integer option on every packaging call; the caller must choose it according to an explicit device-memory and IndexedDB-storage budget. Oversized files are rejected before parsing/encoding.
- The packager is separate from UI/FileReader and from the pure scene compiler. It performs no network or filesystem I/O and does not upload or persist assets.
- Added 12 focused tests for valid package output, subarray handling, caller size limits, invalid headers/versions/lengths, malformed/truncated chunks, invalid JSON/version, external buffer/image/extension URIs, invalid URI types, embedded data URIs and duplicate JSON/trailing data.
- Scene compiler tests now consume a data URL produced by the packager, exercising the package-to-compile boundary.
- **Not implemented:** browser file-picker integration, IndexedDB sidecar persistence, product-level file-size policy, project import UI changes or backend storage.

### 12.9 Verification evidence — 20 November 2026

- Focused GLB packager + compiler suites: **28/28 tests passed** (12 packager + 16 compiler).
- Full resource-safe Vitest run `npx vitest run --pool=threads --maxWorkers=1`: **8/8 files passed, 141/141 tests passed** (89 existing editor tests + 24 contract tests + 16 compiler tests + 12 packager tests).
- `npm run typecheck`: exit 0 after packager and test additions.
- `npm run lint`: exit 0 after packager and test additions.
- `npm run build`: exit 0; Vite transformed 2,478 modules and completed in 21.04s. Workbox generated `dist/sw.js` (2,046 bytes) and `dist/workbox-2fbc6a65.js` (15,026 bytes); PWA precache remains 18 entries / 2,804.85 KiB.
- Existing large-bundle warning remains: main JS 1,961.50 kB (561.24 kB gzip), above Vite's 500 kB advisory threshold.
- `git diff --check`: exit 0 before the context update.
- Packager commit: `2b07500b3d5432989a6397269df489ff9542c8d1` (`feat: validate and package self-contained GLB assets`). Push to `toonforge/stage1/source-import` succeeded; `git ls-remote` verified the remote branch SHA equals this commit. GitHub fetches independently verified the context, packager source, packager tests and compiler-to-packager test integration.

### 12.10 Manifest import orchestration and durable metadata — 20 November 2026

**Implemented, verified, committed and pushed to GitHub on 20 November 2026.**

- Added `src/domain/manifest-import.ts` with a pure `compileManifestImport` orchestration boundary. It validates unknown manifest input, resolves each unique referenced GLB asset ID to caller-supplied bytes, packages each asset once, invokes the scene compiler and returns the compiled `Project`, metadata sidecars and total raw asset bytes.
- Requires explicit caller-provided `maxAssetBytes` and `maxTotalAssetBytes` limits. No product-wide cap is selected implicitly. Both limits are checked before data-URL encoding; duplicate references to the same asset count once.
- Added `src/domain/metadata.ts` defining `ProjectManifestMetadata`, keyed by project ID, for manifest identity/schema version, asset provenance and scene metadata.
- Upgraded Dexie `MotionStudioDB` from version 1 to version 2 additively. The existing `projects` store/indexes remain unchanged; new `projectMetadata` store is added. No existing projects are rewritten or dropped.
- Added atomic `saveCompiledManifestImport` transaction to persist the editor Project and its metadata sidecar together; it rejects a manifest/project ID mismatch before writing.
- Added `getProjectManifestMetadata`; project deletion and database reset now remove sidecars in the same transaction.
- `duplicateProject` now clones the metadata sidecar, assigns the copied manifest the new project ID, and remaps scene metadata keys to the copied scene IDs. Asset provenance keys remain stable because the copied model layers still refer to the same embedded model data.
- Added a real version-1-to-version-2 Dexie migration test with a populated legacy project. It verifies the project survives byte-for-byte and the new metadata store is empty after upgrade.
- **Not implemented:** UI/file-picker wiring, product-level asset size policy, secure Project JSON import validation, backend persistence or provider orchestration. `ProjectsPage` still parses imported JSON and casts it to `Project`; that remains a separate security task.
- No project renderer/store duplication, provider secrets, deployment or Render resource was added.

### 12.11 Verification evidence — 20 November 2026

- Focused import orchestration + DB/migration suites: **17/17 tests passed**.
- Full resource-safe Vitest run `npx vitest run --pool=threads --maxWorkers=1`: **10/10 files passed, 151/151 tests passed**.
- `npm run typecheck`: exit 0 after orchestration, metadata and DB migration changes.
- `npm run lint`: exit 0 after orchestration, metadata and DB migration changes.
- `npm run build`: exit 0; Vite transformed 2,478 modules and completed in 21.13s. Workbox generated `dist/sw.js` (2,046 bytes) and `dist/workbox-2fbc6a65.js` (15,026 bytes); PWA precache: 18 entries / 2,805.60 KiB.
- Main JS bundle is now 1,962.25 kB (561.44 kB gzip), still above the 500 kB advisory threshold. No bundle-size optimization was attempted in this block.
- `git diff --check`: exit 0 before the context update.
- Implementation commit: `1d5c34c03bc076a2b88b8969e1b23dbcc5323f5f` (`feat: persist compiled manifest metadata`). Push to `toonforge/stage1/source-import` succeeded; `git ls-remote` verified the remote branch SHA equals this commit. `main` remained unchanged at `fcdaf3df50090a3137abe837d9374b03a90c7182`.

### 12.12 Work block plan — secure Project JSON import and controlled manifest import UI

All implementation scope in this work block is now complete and verified in Sections 12.13–12.14.

1. **Done:** strict runtime schema/version strategy for current Project JSON, with backward compatibility for valid legacy raw exports and rejection of malformed/unsupported files.
2. **Done:** hardened `ProjectsPage` import with JSON parse handling, runtime validation and a visible 20 MiB size limit. This remains a conservative provisional guard pending target-client memory/storage measurement.
3. **Done:** controlled scene-manifest import flow accepts a manifest and referenced GLB files, maps each file to its asset ID, calls `compileManifestImport`, then persists via `saveCompiledManifestImport`.
4. **Done:** manifest metadata sidecars are retained through atomic save, duplicate, delete, reset and versioned Project JSON export/import round-trips.
5. No provider calls or secrets were added to browser code. No Render service or deployment was created.
6. Both implementation and context checkpoints were committed and pushed only to `stage1/source-import`; remote SHA and unchanged `main` were verified.

**Stage 1 remains in progress; no production readiness or deployment claim is made.**

### 12.13 Secure Project JSON import hardening — 20 November 2026

**Implemented, verified and pushed to GitHub on 20 November 2026.**

- Added `src/domain/project-import.ts` with strict Zod runtime validation for the existing editor Project model: project settings, all eight layer variants, keyframes, scene transitions, optional scene backgrounds, finite numeric values, unique scene/layer/keyframe IDs and valid parent-layer references.
- Introduced a versioned export envelope (`kind: toonforge.project`, `schemaVersion: 1.0`). The importer accepts both this format and existing unwrapped legacy Project JSON. Unknown fields, malformed payloads, non-object roots and unsupported file kinds/schema versions are rejected before IndexedDB writes.
- Imported thumbnail/image/model sources must be embedded `data:` URLs. External `http(s)` asset URLs are rejected to prevent project loading from triggering arbitrary remote asset fetches.
- Hardened `ProjectsPage`: checks file size before reading, uses `File.text()`, treats parsed JSON as `unknown`, validates it at runtime, assigns a new project ID/timestamps and uses `db.projects.add()` so an ID collision cannot overwrite an existing project. The input is reset after success or failure.
- Added a visible **20 MiB** import limit and English/French error messages. This is an initial conservative guard, not a measured memory/storage acceptance limit; verify it on the intended browser client before production use.
- Added nine focused tests covering legacy compatibility, versioned format, all layer variants, embedded asset data, unsupported versions, malformed structures, unknown fields, external URL rejection and size policy.
- The original limitation that manifest/provenance sidecars were not included in Project JSON exports was resolved in Section 12.14: versioned exports now include the optional metadata sidecar, and imports validate, re-key and persist it atomically.

#### Verification evidence — 20 November 2026

- Full resource-safe Vitest run `npx vitest run --pool=threads --maxWorkers=1 --reporter=dot`: **11/11 files passed, 160/160 tests passed**.
- `npm run typecheck`: passed (exit 0).
- `npm run lint`: passed (exit 0).
- `npm run build`: passed (exit 0); Vite transformed 2,574 modules and completed in 21.32s. Workbox generated `dist/sw.js` and `dist/workbox-2fbc6a65.js`; PWA precache: 18 entries / 2,897.08 KiB.
- Existing bundle advisory remains: main JS 2,054.77 kB (588.72 kB gzip), above Vite's 500 kB warning threshold. This was not optimized in this work block.
- `git diff --check`: passed after correcting the context-header whitespace.
- Implementation commit: `bf55af30d31bc8c7cc5f243cf53e9ce9231f382d` (`feat: validate and version project JSON imports`). Push to `toonforge/stage1/source-import` succeeded; `git ls-remote` confirmed the remote branch SHA equals this commit. `main` remained unchanged at `fcdaf3df50090a3137abe837d9374b03a90c7182`.
- Independent GitHub fetch verified `project-import.ts`, its tests, `ProjectsPage.tsx`, and both English/French project locale files on `stage1/source-import`.
- The working tree after the implementation push contained only this context-file update; context checkpoint is the remaining local write.
- The 20 MiB import limit remains provisional pending actual target-browser memory/storage measurements.

**Completed in Section 12.14:** controlled scene-manifest import UI and metadata-preserving Project JSON export/import. No Render deployment or provider calls were part of this work.

**Stage 1 remains in progress; no production readiness or deployment claim is made.**

### 12.14 Controlled scene-manifest import UI and metadata-preserving Project JSON round-trip — 20 November 2026

**Implemented, verified, committed and pushed to GitHub on 20 November 2026.**

- Added `src/components/ManifestImportDialog.tsx` and wired a separate **Import scene manifest** action into `ProjectsPage`; the existing Project JSON import remains a distinct workflow.
- The dialog validates unknown manifest JSON through `SceneManifestSchema`, identifies unique referenced GLB assets by asset ID, displays each manifest path/ID, and requires the selected local filename to match the manifest path basename. Unused assets do not require file selection.
- Preflight reports unsupported features in English/French and blocks import rather than silently dropping them: dialogue tracks, audio cues, non-GLB scene assets and material color/roughness/metalness overrides. Only supported GLB v2 scene assets proceed to the existing compiler/packager boundary.
- The UI checks the manifest file before reading and validates GLB filename/size/aggregate size before `arrayBuffer()`. Current provisional limits: **2 MiB manifest JSON, 5 MiB per GLB, 10 MiB total GLB bytes**. These are conservative initial limits, not measured target-browser limits. The 10 MiB raw aggregate has approximately 13.3 MiB base64 expansion, leaving headroom under the 20 MiB Project JSON import cap; target-client memory and IndexedDB quota still require direct measurement.
- The UI maps selected `File.arrayBuffer()` data by manifest asset ID, calls `compileManifestImport` with explicit per-file/aggregate limits and a fresh `import-` project ID, then persists through `saveCompiledManifestImport`. The DB path now uses atomic Dexie `add()` writes rather than `put()` for imports, so a project-ID collision cannot overwrite an existing project or its sidecar.
- Added `saveProjectImport` for atomic persistence of a validated Project plus optional metadata sidecar. Versioned Project JSON exports now include `ProjectManifestMetadata` when present; imports validate metadata identity/schema/path fields, re-key the project and manifest IDs, preserve asset/scene metadata and save both records atomically. Legacy raw Project JSON remains supported. Orphaned scene metadata is retained so deleting a scene does not make a later export/import fail.
- Added `src/domain/manifest-import-ui.ts` for pure manifest preflight and explicit file-size policy. Added English/French strings for the dialog, limits, errors and unsupported features.
- Added component tests for successful manifest-to-GLB mapping/persistence, filename mismatch rejection and unsupported-feature blocking; helper tests cover unique referenced assets, unsupported features and file-size boundaries. Project import and DB tests cover metadata round-trip/re-keying, atomic persistence, identity mismatch and duplicate-ID overwrite protection.
- No editor renderer/store was duplicated or changed. No provider calls, secrets, Render service, deployment or external publishing action was added.

#### Verification evidence — 20 November 2026

- Full resource-safe Vitest run `npx vitest run --pool=threads --maxWorkers=1 --reporter=dot`: **13/13 files passed, 174/174 tests passed**.
- `npm run typecheck`: passed (exit 0).
- `npm run lint`: passed (exit 0).
- `npm run build`: completed; `dist/index.html` regenerated at 15:44 local time, Vite main JS bundle `2,100,764` bytes (gzip `594,456` bytes), CSS `41,627` bytes. Workbox `dist/sw.js` is 2,046 bytes and `dist/workbox-2fbc6a65.js` is 15,026 bytes; `dist/` totals 6.0 MiB. The existing Vite 500 kB bundle advisory remains unresolved.
- `git diff --check`: exit 0.
- Implementation commit: `d1bf1dd0c9938ea9597af9dfa9081fa1ff036191` (`feat: add controlled scene manifest import UI`). Push to `toonforge/stage1/source-import` succeeded; `git ls-remote` confirmed remote `stage1/source-import` equals this commit. `main` remained unchanged at `fcdaf3df50090a3137abe837d9374b03a90c7182`.
- Independent GitHub fetch verified `ManifestImportDialog.tsx` and tests, manifest import helper, Project import schema, DB persistence, ProjectsPage and both locale files on `stage1/source-import`.

**Completed in Section 12.15:** RDC Chromium verification of Projects page, manifest import, GLB mapping, validation errors, legacy/versioned Project JSON import, metadata-preserving export/re-import and IndexedDB persistence. Baseline browser storage/heap estimates were captured. The WebGL and export statements in the original 12.15 checkpoint are superseded by the additional runtime evidence in Section 12.16; no Render deployment is authorized.

**Stage 1 remains in progress; no production readiness or deployment claim is made.**


### 12.15 RDC target-browser verification and WebGL capability checkpoint — 20 November 2026

**Import workflows verified in a disposable local Chromium profile. The original WebGL/export limitation recorded here is superseded by Section 12.16. Stage 1 remains in progress.**

#### Browser and import workflow evidence

- Started the existing Vite app locally at `http://127.0.0.1:4173` through RDC. No deployment or Render resource was created.
- Chromium 156.0.8078.79 was driven through the Chrome DevTools Protocol using Node 22's built-in WebSocket API. The repository does not have `puppeteer`, `puppeteer-core`, `playwright` or `playwright-core` installed; no browser dependency was added.
- Verified the Projects page renders at a 1440 px viewport and exposes separate Project JSON import and **Import scene manifest** actions.
- Manifest import: selected an 837-byte valid scene manifest, mapped its referenced `assets/characters/hero.glb` asset to a 52-byte valid GLB v2 file, confirmed the import action became enabled, and imported successfully.
- IndexedDB verification: `MotionStudioDB` contains both `projects` and `projectMetadata` stores. The manifest import created one Project with `mesh` and `camera3d` layers; the metadata sidecar retained manifest identity, asset ID `hero`, and scene ID `scene-one`. Project ID and manifest ID matched.
- Negative UI cases verified: invalid manifest schema displayed a validation error and kept import disabled; dialogue-bearing manifest displayed an unsupported-feature error and disabled both asset selection and import; mismatched GLB filename displayed the expected filename error and kept import disabled.
- Legacy raw Project JSON import succeeded and created a new Project without an invented metadata sidecar.
- Versioned `toonforge.project` schema `1.0` JSON import succeeded and re-keyed both Project and metadata identity.
- Exported the manifest-backed Project through the Projects card's **Export JSON** action. The downloaded 2,984-byte file contained the versioned envelope and metadata sidecar (asset ID `hero`). Re-importing that exact downloaded file created another Project with a new ID and a matching re-keyed metadata sidecar.
- After browser reload, the isolated test profile retained four Projects and three metadata sidecars in IndexedDB. No console error entries were observed during the Projects page reload. All test data was created in a disposable Chromium profile; no user project data was touched.
- Temporary Chromium profiles, test files, downloads and the local Vite server were closed/cleaned up after verification.

#### Baseline browser storage and heap observation

Captured from the disposable headless Chromium profile after the import/export checks; this is a baseline observation, not a production capacity test or a guarantee for other devices:

- `navigator.storage.estimate()`: usage **362,227 bytes**; reported quota **10,737,780,467 bytes**.
- Reported usage details: caches **3,840 bytes**, IndexedDB **17,118 bytes**, service-worker registrations **341,269 bytes**.
- `performance.memory`: JS heap used **76,354,816 bytes**, total **78,152,492 bytes**, heap limit **2,104,492,032 bytes**.
- These measurements do not establish safe maximum import sizes. Large-file peak memory, base64 expansion, actual browser/device IndexedDB quota and quota-exhaustion recovery remain untested. Keep the 2 MiB manifest / 5 MiB per-GLB / 10 MiB aggregate GLB / 20 MiB Project JSON caps provisional.

#### WebGL/WebGL2 blocker discovered

- Tested the actual 3D editor route in a second headless Chromium launch with `--enable-unsafe-swiftshader`, `--use-gl=angle` and `--use-angle=swiftshader`; the 3D editor loaded its UI, but no WebGL or WebGL2 context could be created.
- Chromium's `chrome://gpu` report explicitly showed **OpenGL: Disabled**, **WebGL: Disabled**, **WebGPU: Disabled**, and **GPU process was unable to boot: GPU process crashed too many times with software GL**. The GPU device identifiers were zero/unknown and the renderer fell back to software-only mode. WebGL was reported disabled via blocklist or command-line policy even with the SwiftShader attempt.
- The earlier smoke browser was explicitly launched with `--disable-gpu`; it is not used as evidence of WebGL capability. The separate SwiftShader attempt without `--disable-gpu` also failed, so this is a real limitation of the current headless host/runtime rather than proof that the application itself is incompatible.
- **Impact:** WebGL/WebGL2 scene rendering and actual browser video export cannot be accepted as verified on this RDC Chromium host. Do not proceed to claim 3D runtime readiness, video-export readiness or Stage 1 completion based only on the successful import tests.
- **Required next action:** repeat WebGL/WebGL2 and media capability tests on a supported user-controlled browser/device with working GPU or a validated software WebGL runtime. Capture renderer/vendor/version, `MediaRecorder.isTypeSupported` results, a short real export artifact and playback/integrity evidence before deciding the rendering architecture.

#### Code correction discovered during this checkpoint

- The full-suite run exposed a schema compatibility bug: `sceneMetadata` record keys were validated with the manifest asset-ID regex, but the existing editor `uid()` generator can produce scene IDs beginning with digits.
- Added a deterministic regression case using scene ID `1scene`; it failed before the fix and passed after changing only the `sceneMetadata` record-key schema to accept non-empty editor IDs (max 128 chars). Manifest asset IDs and optional `storySceneId` retain their strict manifest-ID validation.
- Corrected the Projects page translation reference from `importManifest` to the existing locale key `manifestImport`; both English and French locale dictionaries already define that key.

#### Verification evidence — 20 November 2026

- Focused Project import suite: **12/12 tests passed** after the regression fix.
- Full resource-safe Vitest run: **13/13 files passed, 174/174 tests passed**.
- `npm run typecheck`: passed (exit 0).
- `npm run lint`: passed (exit 0).
- `npm run build`: passed (exit 0); Vite transformed 2,580 modules. Main JS bundle approximately **2,100.78 kB** (gzip **600.76 kB**); the existing 500 kB chunk advisory remains unresolved. Workbox generated the service worker and precache.
- `git diff --check`: passed before this context update.
- At the start of this work block, local HEAD and `toonforge/stage1/source-import` both matched `8dbf400a20b33de69babdd431f97d4f152c841f2`; `main` was not checked out or modified. The code and context changes from this work block still require a commit and push to the continuation branch.

**Next work block:** resolve the WebGL/WebGL2 environment blocker by testing on a supported user-controlled browser/device, then verify a short real video export and measure large-file peak memory/IndexedDB quota behavior. Only after those checks should the provisional import caps be reconsidered. Do not deploy to Render or claim production readiness without the Stage 1 exit gate.

**Stage 1 remains in progress; no production readiness or deployment claim is made.**


### 12.16 RDC runtime follow-up: WebGL context loss and real MP4 export defect — 21 November 2026

**This section supersedes the WebGL and export capability conclusions in the original Section 12.15. Import verification remains valid. Stage 1 is still blocked; no deployment or production-readiness claim is made.**

#### Environment and minimal WebGL capability

- Reconnected to the same RDC device and verified the repository remained on `stage1/source-import` with a clean worktree before testing.
- Environment: Chromium **156.0.8078.79**, headless Linux ARM64 container. No `/dev/dri`, `/dev/kgsl-3d0`, or `/dev/mali0` device nodes were available; no hardware GPU is exposed to this container.
- A minimal isolated test using separate canvases successfully created both WebGL 1 and WebGL 2 contexts. Reported renderer: **ANGLE / Vulkan 1.3.0 / SwiftShader**; maximum texture size **8192**. This corrects the earlier conclusion that no WebGL context could be created at all.
- A disposable 3D Project with a box mesh and camera layer was created in the isolated Chromium profile. The actual ToonForge editor route rendered its UI and created a WebGL canvas (1096 × 609). The renderer then emitted repeated **GPU stall due to ReadPixels** warnings and subsequently **CONTEXT_LOST_WEBGL**.
- **Conclusion:** WebGL2 capability exists in this software-rendered Chromium configuration, but the actual 3D editor does not maintain a stable context under this workload. This is not a hardware-GPU test and does not establish that the same failure occurs on a supported desktop GPU/browser. Stable 3D scene rendering remains unverified.

#### MediaRecorder capability and actual output

- In the same Chromium runtime, `MediaRecorder.isTypeSupported` returned:
  - `video/mp4`: **true**
  - `video/mp4;codecs=avc1.42E01E`: **true**
  - `video/webm`: **true**
  - `video/webm;codecs=vp8`: **true**
  - `video/webm;codecs=vp9`: **true**
  - `video/quicktime`: **false**
- Created a disposable **2D** Project with a 1.0-second scene and exported using the actual Export Modal: MP4 format, 480p, 30 fps. The app displayed **Export complete** and Chromium downloaded `rdc-2d-export-smoke.mp4`.
- Artifact inspection: **6,830 bytes**; recognized as an ISO Base Media MP4 file. It was served back into Chromium and loaded/played without a media error. Playback metadata reported **853 × 480**, `readyState=4`, and duration **10.9193 seconds**.
- The Project timeline was **1.0 second** at **30 fps**, but the playable MP4 duration was approximately **10.919 seconds**. This is a confirmed output-contract failure, not just an estimate. It is consistent with the current `captureStream` + `MediaRecorder` implementation recording wall-clock render time while frame rendering is slower than the target frame budget; per-frame timing instrumentation is still needed to isolate the exact contribution.
- MP4 box inspection found the video sample entry **`vp09`** (VP9), while the UI labels the option **MP4 (H.264)**. The generic `video/mp4` MIME accepted by the current app code did not produce the advertised H.264 codec in this Chromium runtime. The full ToonForge Export Modal has not yet been verified with an explicit H.264 MIME; the isolated explicit-H.264 MediaRecorder probe below did produce and inspect an `avc1` sample entry.
- MOV is also exposed in the UI, while `video/quicktime` reports unsupported and the existing locale/help text says MOV conversion is not implemented. Do not treat the MOV option as a working export format.
- `ffprobe` was not installed in this container; container/sample-entry inspection and actual Chromium playback metadata were used instead. No third-party dependency was installed.

#### Production blockers opened by this test

1. **3D renderer stability:** investigate the editor's repeated GPU stalls/context loss on a supported GPU/browser. Capture renderer/vendor/version and verify the imported GLB/mesh scene renders continuously, not just that a context can be created.
2. **Video timeline duration:** the current MediaRecorder path does not preserve a 1-second timeline under slow frame rendering. Instrument per-frame render/capture times and design a deterministic timestamped encoding path. Evaluate WebCodecs plus a compatible muxer, or a controlled encoding service, against the browser-first architecture, memory, compatibility and cost before implementation. Do not hide the duration mismatch by merely changing the displayed duration.
3. **Codec contract:** select an explicit codec MIME using `MediaRecorder.isTypeSupported`, fail clearly when unavailable, and verify the resulting file's actual sample entry. The current generic MP4 path produced VP9 despite the H.264 label.
4. **MOV contract:** remove/disable the MOV option until a real conversion implementation exists, or implement and test the conversion path. A UI choice alone is not support.
5. **Target-device capacity:** repeat tests on the intended client hardware, then measure 1–3 minute projects, peak memory, IndexedDB quota behavior and cancellation/recovery.

#### Change, Git and cleanup status

- No application source code was changed during this follow-up. No tests were rerun because this work block was runtime investigation and documentation only.
- No Render deployment, production service change, public publishing action or user-project modification was performed. All smoke projects and downloads were confined to a disposable Chromium profile.
- The runtime evidence is a new Stage 1 blocker register entry, not an acceptance sign-off. Resolve the export duration and codec defects before treating video export as production-capable.
- Gracefully closed the disposable Chromium instance, stopped the Vite and media test servers, removed the temporary browser profile/download directory and verified that no test processes or listeners remained on ports 4173, 4174 or 9222. The repository and branch state were preserved.

**Next work block:** reproduce stable 3D rendering on a supported GPU/browser; design a deterministic export correction with a regression test for timeline duration and codec selection; then verify real MP4 and WebM artifacts and playback. Keep the current provisional import limits unchanged. Do not deploy to Render or claim Stage 1 completion.


#### Additional codec/encoder feasibility probe — 21 November 2026

- An isolated explicit-MIME `MediaRecorder` test using `video/mp4;codecs=avc1.42E01E` successfully produced a **5,112-byte MP4**. Chromium reported its negotiated MIME as `video/mp4;codecs=avc1.420015`; the MP4 video sample entry was **`avc1`**. This proves the current Chromium runtime can produce H.264 when the codec is explicitly requested. It does not yet prove the app's full export flow uses this explicit path.
- WebCodecs `VideoEncoder.isConfigSupported` returned supported for H.264 (`avc1.42001E`, `avc1.42E01E`), VP9 (`vp09.00.10.08`) and VP8 (`vp8`) at 640 × 360 / 30 fps.
- A five-frame WebCodecs H.264 encode completed with **5 encoded chunks**, **1,912 bytes**, codec metadata `avc1.42E01E`, a 33-byte decoder configuration description and no encoder errors. This was an encoder-only probe; no MP4 container/muxer was produced.
- Repository dependency/source inspection found no existing `mp4-muxer`, `webm-muxer`, `mp4box.js`, `mp4box`, `webm-writer` or `@webav/av-cliper` dependency/reference. A deterministic WebCodecs implementation would therefore need an evaluated muxer dependency or a deliberately implemented container writer; do not assume this capability is already present.

### 12.17 RDC deterministic 2D video export correction and streaming verification — 21 November 2026

**This section supersedes the 2D video-export duration/codec findings in 12.16. It does not resolve the 3D WebGL context-loss blocker. Stage 1 remains in progress; no production-readiness or deployment claim is made.**

#### Implementation changes

- Added mediabunny@1.66.2 (MPL-2.0) as the browser-side WebCodecs encoder/muxer.
- Replaced the MediaRecorder wall-clock capture path with timestamped CanvasSource encoding:
  - MP4 uses H.264 (avc) in an MP4 container.
  - WebM uses VP9 (vp9) in a WebM container.
  - canEncodeVideo checks whether the selected encoder/settings are available before rendering begins; unsupported configurations fail with a clear UI message.
  - Each frame is assigned its timeline timestamp and duration. Rendering may take longer than playback duration without stretching the exported timeline.
- Added pure timeline helpers:
  - getVideoExportFrameCount computes the required frame count.
  - getVideoExportFrameTiming returns each frame's exact timestamp and duration, clipping the final frame to the remaining timeline duration.
  - Invalid durations, frame rates and frame indexes are rejected.
- Added H.264 dimension normalization: odd source dimensions are padded to the next even output dimension without shrinking the content. Example: an 853 × 480 project exports as 854 × 480 MP4; WebM retains the 853 × 480 source dimensions.
- MOV is disabled in the format selector because no MOV conversion encoder exists.
- Added WebGL context-loss detection during frame rendering. A lost context stops export with a recovery message rather than silently generating corrupt/blank output.
- Large estimated video exports above **48 MiB** use showSaveFilePicker and Mediabunny StreamTarget; smaller outputs use BufferTarget. If the browser does not expose the file picker for a large export, the UI asks the user to reduce resolution, quality or duration rather than allocating an unbounded output Blob. The writable stream is tracked and aborted on failures before finalization to avoid leaving a partial file handle open.
- Mediabunny is dynamically imported only when MP4/WebM export is requested. This avoids adding the muxer to the initial application bundle; GIF remains independent of Mediabunny.
- Updated English and French editor, landing-page and help text to describe WebCodecs exports, encoder/device dependency, MOV limitation and large-export file streaming.

#### Browser verification — actual 2D project and artifacts

Environment: disposable Chromium **156.0.8078.79**, headless Linux ARM64 container with SwiftShader software rendering. This is a 2D export verification only, not a hardware-GPU or 3D renderer acceptance test.

- Created a disposable 2D project through the production build's actual project wizard, added a visible purple rectangle through the editor UI, and exported through the actual Export Modal.
- **MP4 result:**
  - 480p output: **854 × 480**.
  - MP4 sample entry: **avc1** (H.264).
  - MP4 track timescale: 30; sample count: **90 frames**.
  - Movie and video-track duration: exactly **3.0 seconds**.
  - Artifact: **8,744 bytes**, recognized as ISO Base Media MP4.
  - Served the exact artifact back into Chromium. It loaded and played with readyState=4, no media error, 3.0-second duration and visible non-black/purple scene pixels.
- **WebM result:**
  - Output: **853 × 480**.
  - WebM codec marker: **V_VP9**.
  - Chromium playback metadata: exactly **3.0 seconds**, 853 × 480, readyState=4, no media error, playback active and visible non-black/purple scene pixels.
  - Artifact: **7,067 bytes**, recognized as WebM.
- Both artifacts were generated from the same 3.0-second project timeline. This verifies that the prior 1.0-second-to-10.919-second MediaRecorder defect and generic-MIME VP9-in-MP4 mismatch no longer reproduce in the actual 2D Export Modal on this Chromium runtime.
- The encoder module was lazy-loaded from a separate production chunk. Build output:
  - Main JS: **2,105.99 kB** (gzip **602.55 kB**).
  - Mediabunny dynamic chunk: **243.79 kB** (gzip **64.37 kB**).
  - The previous static-import build's main bundle was **2,350.14 kB** (gzip **667.01 kB**). The initial bundle therefore dropped by approximately the dynamic chunk size.
  - The existing Vite **500 kB** chunk-size advisory remains for the main application bundle.

#### Large-export streaming-path verification

- Set a disposable test project's scene duration to **26 seconds**, selected MP4, 480p and Maximum quality. The UI estimate was **49.6 MB**, exceeding the 48 MiB in-memory threshold.
- In the isolated browser test only, stubbed window.showSaveFilePicker with a mock file handle backed by a real WHATWG WritableStream. This forced the production StreamTarget code path without opening a native file picker or writing a real user file.
- Observed the expected suggested filename and MP4 file type, then completed all 780 timeline frames.
- On finalization, the mock writable sink received **1 chunk / 71,187 bytes**, closed successfully, and the app displayed **“Your video has been saved to the selected file.”**
- **Scope limitation:** this validates the app's large-export branch, Mediabunny StreamTarget writes, stream finalization and UI state using a mock writable sink. The native browser File System Access picker and a real on-disk streamed output were not exercised. Do not claim native file-system streaming is fully accepted until that separate test is performed.

#### Automated verification — 21 November 2026

- Added two pure unit-test files:
  - src/domain/video-export-timing.test.ts
  - src/domain/video-export-resolution.test.ts
- New focused tests: **7/7 passed**.
- Full Vitest suite: **15/15 test files, 181/181 tests passed**.
- npm run typecheck: passed (exit 0).
- npm run lint: passed (exit 0).
- npm run build: passed (exit 0); Workbox generated the service worker and precache.
- git diff --check: passed.
- Main bundle warning remains; no chunk-size warning was suppressed or hidden.

#### Remaining blockers and next work

1. **3D WebGL stability remains open.** The actual editor previously lost its WebGL context under SwiftShader. Re-test on a supported user-controlled desktop browser/device with a real GPU, import/render a GLB, and verify a stable scene over time. Do not infer 3D readiness from the 2D export results.
2. **Native File System Access remains unverified.** Test a large export using the actual browser picker and a real file handle; verify file integrity, playback, cancellation, write failure and cleanup. The mock WritableStream result above is not a substitute for that test.
3. **Target-device performance remains open.** Test 1–3 minute timelines, peak memory, 4K/60 fps encoder limits, thermal/CPU constraints, IndexedDB quota and recovery on intended client hardware.
4. **Export cancellation and WebGL-loss recovery need dedicated end-to-end browser tests.** The current helper unit tests cover timeline arithmetic, not the full cancellation/failure lifecycle.
5. The 48 MiB buffer threshold is a conservative implementation guard, not a measured maximum-safe browser heap limit. Keep the provisional manifest/GLB/Project JSON caps unchanged until target-device capacity tests pass.

#### Git, deployment and cleanup

- Current branch remains stage1/source-import; no checkout of main occurred.
- Implementation commit **9b39714af8040f907fa415f334efd968f78316e7** (`fix: use timestamped WebCodecs for video exports`) was pushed to `toonforge/stage1/source-import`. GitHub's commit API, remote branch SHA and the four key source/context file entries were checked and matched. `main` remains at `fcdaf3df50090a3137abe837d9374b03a90c7182`. No pull request was opened; the repository had no open PRs for this branch at the time of the check.
- No Render deployment, public release, production-service change or public content publication occurred.
- All test projects were created in the disposable Chromium profile. The native user's project data was not accessed or modified.
- Gracefully closed the disposable Chromium instance, stopped the Vite preview and MP4/WebM playback servers, removed the disposable browser profile and temporary export artifacts, and verified no owned test processes or listeners remained on ports 4173, 4180, 4181 or 9224.

**Next task:** continue the unresolved 3D WebGL stability work on a supported user-controlled desktop browser/device with a real GPU. Separately test native File System Access with a real file handle and verify large-output integrity, cancellation and recovery. Keep target-device performance and memory tests open. Do not deploy to Render or claim Stage 1 completion.


### 12.18 Follow-up WebGL context-loss diagnostics and RDC cleanup — 21 November 2026

**Status: 3D WebGL remains an open runtime blocker. This section records additional diagnostic evidence; it is not a fix or a Stage 1 acceptance sign-off.**

#### Additional 3D editor runtime evidence

- Reopened the production build in disposable headless Chromium and inspected the actual 3D editor canvas under the available Linux ARM64 SwiftShader software-rendering environment.
- With `--enable-webgl --ignore-gpu-blocklist` (without the unsafe SwiftShader opt-in), the 3D canvas initially created a WebGL2 context, but the context was lost shortly after page load. Browser logs included Three.js `Context Lost` / `Context Restored` messages, repeated context loss, SwiftShader GPU-stall warnings involving `ReadPixels`, and a later `Canvas has an existing context of a different type` context-creation error.
- With `--enable-unsafe-swiftshader --enable-webgl --ignore-gpu-blocklist`, WebGL2 initially created and reported not-lost, but the actual editor context was lost approximately **4.2 seconds** after context creation. SwiftShader `ReadPixels` GPU-stall warnings and WebGL context-loss logs were also observed.
- A separate bare-WebGL2-canvas follow-up diagnostic did not return a result before the remote call stalled. It is **inconclusive** and must not be represented as a passing or failing bare-WebGL test.
- These tests establish that the actual 3D editor is unstable in this headless SwiftShader environment. They do **not** isolate whether the root cause is application rendering/resource behavior, Chromium, SwiftShader, or their interaction. This host has no physical GPU evidence; do not generalize this result to supported desktop hardware.

#### Diagnostic cleanup and repository state

- Reconnected to the authorized RDC device and inspected targeted process and listener state for the prior diagnostic resources: Vite preview port **4173**, Chromium debugging ports **9226/9227**, and the disposable SwiftShader profile.
- At inspection time, no matching Vite/Chromium diagnostic process and no listener on ports 4173, 9226 or 9227 were present. No active RDC terminal sessions or retained background remote calls were reported. No unrelated process was terminated.
- The general RDC process-list command itself returned an environment error (`ps: Unable to get system boot time`); a targeted `ps -eo pid,comm,args` inspection completed and showed no matching diagnostic processes. The repository state was independently read from the worktree.
- Worktree was clean on `stage1/source-import` at documentation commit `2d9eca41fe3121f7462478a8517a641a495f48c8` before this documentation update. No application code or production configuration was modified during these diagnostics.

#### Updated next actions

1. Reproduce the 3D editor flow on a supported user-controlled desktop browser with a real GPU. Capture browser/GPU/driver versions, console logs, context-loss timing and a minimal GLB scene. If available, compare the same scene against a minimal standalone Three.js/WebGL test to separate app-specific behavior from runtime instability.
2. Keep native File System Access validation separate: use the actual browser picker and a real file handle, then verify output integrity/playback, cancellation, write failure and cleanup. The mock WritableStream test in 12.17 is not native-picker acceptance.
3. Continue target-device memory/performance, long-timeline, 4K/60 fps and export cancellation/recovery tests only on supported target hardware.
4. Do not deploy to Render, claim 3D readiness, or mark Stage 1 complete until the open acceptance criteria are demonstrated.


### 12.19 Demo renderer lifecycle fix and constrained-host verification — 21 November 2026

#### Confirmed renderer lifecycle defect

- Source review found that `LandingPage` keeps `DemoPlayer` mounted while a showcase lightbox is open. It passes `paused={activeShowcase !== null}` to stop the demo timeline, but the prior `DemoPlayer` JSX still mounted its own `Canvas2D` / `Canvas3D` renderer.
- For a video-based 3D showcase, `ShowcaseLightbox` mounts another `Canvas3D` while the paused `DemoPlayer`'s WebGL canvas remains mounted behind it. This creates two simultaneous WebGL renderer contexts on the landing page. It is a verified component-lifecycle/resource issue; it is **not** proven to be the cause of the separate editor-route context loss.
- Changed `src/components/DemoPlayer.tsx` so the renderer is mounted only while `paused === false`. The demo name and mode labels remain visible while paused; the lightbox owns the active renderer.

#### Regression test (TDD)

- Added `src/components/DemoPlayer.test.tsx`, mocking only the heavy Canvas3D/Canvas2D boundaries and using a real default 3D project factory plus the real editor store.
- RED: before the implementation change, the focused test failed because the 3D canvas remained in the document while `DemoPlayer paused`; the normal-playback renderer test passed.
- GREEN: after the change, focused tests passed **2/2**:
  - paused demo releases the renderer while a showcase lightbox is active;
  - normal demo playback keeps the renderer mounted.

#### Verification after code change

- `npm run typecheck`: passed (the full-test pipeline advanced to lint).
- `npm run lint`: passed (the full-test pipeline advanced to Vitest).
- Default parallel Vitest execution stalled the constrained Android-backed container after entering the suite; the owned test session was stopped. No unrelated processes were terminated.
- Re-ran the full suite with one worker and file parallelism disabled: **16/16 test files, 183/183 tests passed**.
- `npm run build`: passed; Vite transformed 2,653 modules and generated the PWA service worker/precache.
- Build output retains the known bundle advisory: main JS **2,105.99 kB** (gzip **602.56 kB**), Mediabunny lazy chunk **243.79 kB** (gzip **64.36 kB**). This was not changed or suppressed.
- `git diff --check`: passed.

#### Host capability boundary and remaining 3D diagnosis

- RDC host configuration identifies the execution environment as **Linux ARM64 inside Docker**, kernel **4.9.190**, with Chromium available in the container.
- The container cannot access `/dev/dri` or `/dev/graphics` (permission denied); `/dev/kgsl-3d0` and `/dev/mali0` are absent, and `adb` is unavailable. The browser diagnostics previously ran under SwiftShader software rendering. This host therefore cannot provide a verified physical-GPU desktop/browser acceptance test.
- Static source inspection confirms `Canvas3D` currently requests `preserveDrawingBuffer: true` for every 3D session, not only export, and enables antialiasing outside export. This may increase renderer cost/resource pressure, but no A/B test has established it as the root cause. Do not remove/change it without an export-capture regression test and supported-browser verification.
- The landing-page duplicate-renderer fix reduces one known source of concurrent WebGL context pressure. It does **not** resolve or close the 3D editor's SwiftShader context-loss blocker.

#### Git and next actions

- This code/test and context update was committed as **275cb97** (`fix: release paused demo renderers`) and pushed to `toonforge/stage1/source-import`. Remote SHA and clean worktree were checked after the push.
- Next: validate the editor and showcase lifecycle on a supported desktop browser with a real GPU. Separately test whether a non-preserved drawing buffer can be used safely for normal editing while preserving deterministic export capture. Keep native File System Access, long timeline, 4K/60 fps, memory/thermal, and export cancellation/recovery acceptance criteria open.
- Do not deploy to Render or claim Stage 1 completion.


### 12.20 Isolated Three.js / SwiftShader context-loss baseline — 21 November 2026

#### Controlled headless-browser experiments

- Browser: Chromium **156.0.8078.79**, Linux ARM64 container, headless, SwiftShader enabled with `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader-webgl`. Tests used `--virtual-time-budget=10000`; these are software-rendering/headless diagnostics, not real-time physical-GPU acceptance tests.
- A minimal raw WebGL2 canvas (no Three.js renderer) created successfully and remained un-lost through its 8-second JS check; the harness reported six animation frames. This is only a narrow control, not a general browser compatibility result.
- A standalone Three.js r185 renderer with a small box scene lost its WebGL context during the 10-second virtual-time test with `preserveDrawingBuffer: false` (observed loss timestamp ~9.01 seconds). Chromium emitted a SwiftShader GPU-stall `ReadPixels` warning.
- Repeating the same standalone Three.js scene with `preserveDrawingBuffer: true` also lost its context (~7.98 seconds), with the same class of GPU-stall warning.
- A second, minimal Three.js test (640x360, one basic-material cube, no shadows, no grid, antialias disabled, `preserveDrawingBuffer: false`) also lost its context (~7.21 seconds), again with `ReadPixels` stall warnings.

#### Interpretation

- These results show that, in this particular headless Chromium + SwiftShader + virtual-time harness, even a minimal Three.js renderer can lose its context. The raw WebGL2 control did not lose context during its check.
- The preserve-buffer A/B does **not** support disabling `preserveDrawingBuffer` as a fix: both settings lost context. No application code change was made based on this test.
- The result increases suspicion of a Three.js/SwiftShader/headless-rendering interaction or test-harness limitation. It does **not** establish the cause of context loss on real GPU hardware or prove a ToonForge-specific bug. Prior app-level context-loss logs remain evidence of failure in this container only.
- The standalone tests ran with virtual time accelerated; do not compare their timestamps directly to wall-clock user experience or the earlier editor timing. A real-time desktop test and a physical-GPU test are still required.
- Temporary HTML diagnostic pages, browser logs, and the Vite server used for this experiment were removed/stopped. No diagnostic files remain in the repository worktree.

#### Next actions

- Do not change renderer context attributes solely from these software-rendering results.
- Obtain a supported desktop browser with an actual GPU and reproduce editor, preview, showcase, and export in real time. Capture GPU/renderer identity, browser version, context-loss timestamps, and console logs.
- If real-GPU failure reproduces, isolate renderer features one at a time (shadows, environment maps, imported GLB, text geometry, reference grid, antialiasing) with a reproducible scene. Keep the physical-GPU and native file-picker acceptance blockers open.
