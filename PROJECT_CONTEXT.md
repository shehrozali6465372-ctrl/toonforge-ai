# ToonForge AI — Project Context & Development Order

**Last updated:** 18 November 2026  
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

## 4. Development order — mandatory sequence

Complete the project in the following dependency order. Reuse prior inspection and test evidence; do not repeat completed work without a reason.

### Stage 1 — Foundation and source audit
- Complete the My Motion Studio source-code audit.
- Inspect current modules, APIs, editor state model, timeline, animation, asset loading and export implementation.
- Identify existing reusable functionality, missing logic, bugs, duplication and technical debt.
- Verify license and dependency health.
- Produce an integration plan without redesigning/recreating working upstream features.

**Exit criteria:** source audit and reuse/extension map documented.

### Stage 2 — RDC browser and WebGL feasibility
- Reuse the already-proven RDC Chromium/Puppeteer setup.
- Open My Motion Studio in RDC.
- Check app readiness, console errors and network failures.
- Test WebGL and WebGL2 context creation.
- Record renderer details where exposed and distinguish hardware acceleration from software rendering.
- Render a small animated Three.js test scene.

**Exit criteria:** target app and 3D canvas initialize reliably on the intended browser.

### Stage 3 — Video export feasibility
- Inspect supported `MediaRecorder` MIME types.
- Record a 10-second test animation.
- Verify downloaded file, MIME type, playability, dimensions and duration.
- Benchmark progressively: 10 seconds, 30 seconds, 60 seconds.
- Measure time, memory, dropped frames and browser stability.
- Only attempt the 1–3 minute target after short tests pass.

**Exit criteria:** a short valid video can be exported and performance limits are measured.

### Stage 4 — Application foundation
- Integrate the existing editor into ToonForge AI.
- Stabilize dependencies and build scripts.
- Establish typecheck, lint, unit tests and production build.
- Keep changes incremental; do not blindly recreate or reorganize upstream code.

**Exit criteria:** reproducible build and tested editor integration.

### Stage 5 — GitHub and Render deployment
- Decide/confirm repository ownership and name.
- Create or fork a dedicated repository only with explicit approval.
- Configure CI.
- Deploy a non-production Render Free Static Site only with explicit approval.
- Verify HTTPS URL and RDC access.

**Exit criteria:** stable hosted frontend accessible from RDC.

### Stage 6 — Project management engine
- Create, save, load and duplicate local projects.
- Manage project settings and scene lists.
- Import/export project manifests and asset bundles.
- Implement autosave/recovery where technically safe.

**Exit criteria:** projects can be saved, reopened, exported and imported.

### Stage 7 — AI story engine
- Prompt-to-story outline.
- Character descriptions and story continuity.
- Dialogue/narration drafts.
- Duration-aware story planning.
- Provider-independent model adapter and strict structured-output validation.

**Exit criteria:** prompt produces an editable, schema-valid story plan.

### Stage 8 — Scene planning engine
- Convert story into scenes and shots.
- Allocate scene durations.
- Define camera instructions, transitions and shot composition.
- Validate total runtime and continuity.

**Exit criteria:** story converts to a valid scene plan.

### Stage 9 — Character generation system
- Original character descriptions and asset selection/generation workflow.
- Character identity/appearance consistency.
- Character asset catalogue.
- Evaluate rigging and animation compatibility.

**Exit criteria:** required characters load consistently in the editor. Do not promise arbitrary automatic rigging until proven.

### Stage 10 — Environment and props engine
- Environments, backgrounds and props.
- Materials, textures and lighting presets.
- Asset provenance and license tracking.
- Loadability and size validation.

**Exit criteria:** scenes can resolve all required environment and prop assets.

### Stage 11 — Animation engine
- Character movement and reusable animation clips.
- Facial/body expression support where assets allow it.
- Keyframes, camera movement and timing.
- Scene transitions and animation validation.

**Exit criteria:** scene plan produces visible, correctly timed animation.

### Stage 12 — Voice and audio engine
- Text-to-speech integration selected on verified quality/cost grounds.
- Character voice assignment.
- Dialogue timing and synchronization.
- Background music and sound effects with appropriate licensing.

**Exit criteria:** audio timeline is synchronized with scene timing and export.

### Stage 13 — Scene compiler
- Convert validated scene manifests into editor state/commands.
- Resolve assets and references.
- Apply transforms, camera, lighting, animation and audio cues.
- Keep a typed adapter between planner output and the editor's actual internal model.

**Exit criteria:** known manifests deterministically build expected scenes.

### Stage 14 — Automatic production orchestrator
- Coordinate story, scenes, assets, animation, audio and rendering.
- Stage status and progress reporting.
- Bounded retries and error recovery.
- Resume failed stages without regenerating successful work.

**Exit criteria:** the production pipeline runs end-to-end with recoverable stage failures.

### Stage 15 — Rendering and export engine
- Render scene sequence in the verified client browser.
- Record video and synchronize audio.
- Export only formats proven to work.
- Validate file size, duration, dimensions and playback.
- Optimize quality/performance within measured device limits.

**Exit criteria:** repeatable 1–3 minute video export on the chosen client hardware.

### Stage 16 — Quality control engine
- Detect missing assets and failed scene loads.
- Check character consistency where measurable.
- Detect silent/misaligned audio and duration mismatch.
- Detect black frames, frozen output and incomplete exports.
- Produce a final validation report.

**Exit criteria:** invalid or incomplete output is detected before being marked complete.

### Stage 17 — End-to-end browser automation
- Automate prompt-to-final-video workflow through RDC.
- Use stable app actions/DOM selectors, not brittle coordinate-only automation.
- Verify retries, resume and export downloads.
- Run repeatable end-to-end test projects.

**Exit criteria:** known prompt produces a validated final video with minimal manual intervention.

### Stage 18 — Final release and production-readiness review
- Full source/security/license audit.
- Performance optimization and regression tests.
- Documentation, recovery procedures and known limitations.
- Final end-to-end acceptance test.

**Exit criteria:** all acceptance criteria pass; only then describe the project as complete/production-ready.

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
- Pushed `RULES.md` to the approved GitHub repository on `main`.
- GitHub commit: `462314f7ce1329a079c5db592fdfd4c17902e255`.
- Remote fetch verification: successful.
- Next work block must start by verifying the repository state and then continue the My Motion Studio source audit/import. No Render service creation yet.
