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
- `npm run build` emitted production files in `dist/` and Vite reported a successful build in 20.32 seconds. However, the Vite/Node process remained alive after printing the completed-build output and did not return a clean process exit. The project-owned stuck build session was terminated after inspecting its process tree. Therefore the build artifact was generated, but clean build-process termination remains unverified and must be investigated before claiming the build gate passed.
- Main generated JavaScript bundle: 1,960.52 kB (560.91 kB gzip); Vite emitted its greater-than-500-kB chunk warning.
- No target-app browser load, WebGL/WebGL2 renderer, MediaRecorder MIME support, real video export or 1–3 minute performance benchmark has been verified yet.
- A verification-only GitHub Actions workflow is now included on `stage1/source-import`; it runs typecheck, lint, tests and build and contains no deployment job. Workflow run status has not yet been verified.

### 11.5 Source import work block status

**Completed 19 November 2026:** the audited editor foundation has been imported into the authorized repository on `stage1/source-import`, preserving the existing project documents and upstream Git history. See Section 12 for the exact remote commit and verification evidence.

**Next task:** diagnose the Vite production-build process that emits completed artifacts but does not terminate cleanly. After the build gate is reliable, proceed with the typed backend/domain foundation. Do not create a Render service or deploy yet.

**Status:** Stage 1 remains in progress; import is complete, while the build-process blocker and backend/domain implementation remain open.

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

### 12.2 Integration verification

- Existing dependency installation was reused through the same project dependency tree; package dependency manifests were compared and matched. No duplicate `npm ci` installation was run.
- `npm run full-test` on `/tmp/toonforge-integration`: TypeScript typecheck passed, ESLint passed, 5 Vitest files passed, 89 tests passed.
- `git diff --cached --check` passed before the import commit.
- `npm run build` produced `dist/` successfully; Vite reported `built in 19.35s`.
- **Build-process blocker remains:** after printing the completed build output, the Vite/Node process stayed alive. A 40-second bounded run ended with `BUILD_EXIT_CODE=124`; therefore clean build-process termination is not verified. The output bundle was 1,961.50 kB (561.24 kB gzip), and Vite emitted the >500 kB chunk warning.
- No target-app browser load, WebGL/WebGL2 renderer, MediaRecorder MIME support, playable video export, audio export or 1–3 minute performance benchmark has been verified.

### 12.3 Exact next work block

1. Diagnose why `vite build` remains in the Node event loop after reporting completion; identify the active handle/plugin and make the smallest verified fix.
2. Re-run the bounded build and require a real exit code of 0; do not hide the issue with a longer timeout or claim success based only on generated files.
3. Then implement the Stage 1 typed domain foundation: versioned project/story/scene schemas, runtime validation, planner/provider contracts, deterministic scene-compiler boundary, persistence abstraction and bounded error handling. Reuse the existing editor model; do not duplicate its store or renderers.
4. Add focused tests for each new contract and preserve the existing 89 passing tests.
5. Push and verify each completed work block on the authorized repository branch before starting the next one.

**Status:** Stage 1 is not complete and the project is not deployment-ready.
