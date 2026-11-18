# ToonForge AI — Engineering Rules & Execution Protocol

**Effective date:** 18 November 2026  
**Project repository:** `https://github.com/shehrozali6465372-ctrl/toonforge-ai.git`  
**Project Library folder:** `/ToonForge AI`  
**Status:** Mandatory project operating rules

These rules govern all development, testing, repository, deployment, and remote-machine work for ToonForge AI. They supersede any conflicting generic workflow assumptions.

## 1. Strict project scope

### GitHub
- Work only in `shehrozali6465372-ctrl/toonforge-ai`.
- Do not inspect, clone, modify, push to, create branches in, or otherwise touch any other repository.
- The My Motion Studio upstream repository may be read only when required to import and understand its source. Never write to or change upstream.
- Before every GitHub write, verify the repository identity, target branch, current commit, and working-tree/change scope where applicable.

### Render
- Use only the Render account identified by the user as **“3rd render 3500”**, workspace **“My Workspace”**.
- Create the ToonForge AI service only after the project code is ready and its required verification has passed.
- The service must be dedicated to ToonForge AI. Do not inspect, modify, restart, redeploy, delete, rename, or otherwise touch any unrelated Render service or resource.
- Do not create the service early merely to test a URL. Do not deploy unverified code.
- Use the least-cost suitable option; no paid plan or paid infrastructure without separate explicit approval.

### Remote Desktop Commander (RDC)
- Use RDC only for ToonForge AI project work: its dedicated project directory, source checkout, project dependencies, project processes, tests, browser checks, and project-specific artifacts.
- Never browse, inspect, edit, stop, or otherwise interact with unrelated projects, directories, processes, credentials, or user data.
- Do not run broad cleanup, global package changes, machine-wide configuration changes, or destructive commands.

## 2. One task / one work block at a time

- Work on exactly one defined task or work block at a time.
- Do not start a new task, feature, audit area, or unrelated investigation while the current task is incomplete.
- Before starting, state or record the task objective, exact scope, expected outputs, and completion criteria.
- Inspect the relevant existing implementation and project state before acting. Do not work blindly on RDC or any other environment.
- Complete the task, run its relevant checks, inspect the result, and record evidence before moving on.
- If blocked, stop that work block, record the precise blocker and evidence, and do not silently switch to another task.

## 3. Mandatory GitHub checkpoint after every completed work block

- At the end of every completed work block, push its completed project changes to the approved ToonForge AI GitHub repository.
- Verify the remote commit and changed paths after pushing.
- Do not begin the next work block until the preceding block's GitHub checkpoint is verified.
- If a push is impossible (for example, the repository has no initial branch yet), record the exact error and stop before starting the next block. Do not claim the checkpoint succeeded.
- Never push secrets, credentials, local environment files, private user data, generated bulky artifacts, or unreviewed changes.
- Use focused commits with clear messages; do not bundle unrelated work.

## 4. No duplication, repetition, or rework

- No duplicate files, modules, components, features, workflows, documentation, or tests.
- Before creating a file or implementation, search the approved project repository and project folder for an existing equivalent.
- Extend or correct the existing implementation when it already serves the purpose.
- Do not repeat completed commands, audits, tests, or investigations unless a new change invalidates prior evidence or a specific failure requires rerunning them.
- Keep a task ledger/checklist with status and evidence so completed work is not accidentally repeated.
- Reuse prior verified results; distinguish verified, failed, pending, and assumed states.

## 5. Feature upgrades: update in place, do not fork duplicate files

When the user asks to upgrade or improve an existing feature:
- Locate and inspect the existing feature and its owning file/module first.
- Modify/overwrite the existing implementation in place where architecturally appropriate.
- Preserve existing public interfaces and behavior unless the requested upgrade requires a documented change.
- Do not create a second file, parallel component, “new version” file, or duplicate feature merely to avoid updating the original.
- If a separate module is genuinely required by architecture, explain why and establish that no existing module can own the responsibility before creating it.
- Update existing tests and documentation rather than duplicating them.

## 6. Professional engineering quality bar

Work to the standard expected of a senior production engineer with deep experience in React/TypeScript, creative tooling, 3D graphics, animation pipelines, and software delivery:
- Understand the architecture and data flow before changing code.
- Prefer simple, maintainable, typed, modular designs over unnecessary complexity.
- Follow existing project conventions unless they are demonstrably defective.
- Consider correctness, performance, memory, accessibility, security, dependency health, licensing, recoverability, and maintainability.
- For 3D work, verify scene graph ownership, coordinate conventions, transforms, materials, lighting, camera behavior, animation timing, asset lifecycle, and disposal/resource cleanup.
- For rendering/export, verify actual browser capabilities, supported codecs/MIME types, frame timing, audio synchronization, output validity, and measured performance. Never infer support from a UI label.
- Avoid mock success claims. Use reproducible tests and report actual evidence and limitations.
- Do not claim a feature or stage is complete until its acceptance criteria pass.

## 7. Safe execution protocol

Before every meaningful change:
1. Confirm the approved repository/project path and current state.
2. Inspect the relevant files and existing implementation.
3. Check for duplicate functionality and previous work.
4. Define the smallest safe change.
5. Preserve unrelated work and user data.

After every meaningful change:
1. Review the diff and changed paths.
2. Run relevant tests, typecheck, lint, and/or build.
3. Fix failures caused by the change; do not conceal pre-existing failures.
4. Record commands, results, commit, and remaining risks.
5. Complete the mandatory GitHub checkpoint before the next work block.

## 8. Deployment and production safeguards

- No Render service creation until code is ready and verification is complete.
- No production publishing, public content posting, or external side effects unless explicitly authorized for that exact action.
- Do not change credentials, environment secrets, schedules, or unrelated infrastructure.
- Static hosting is not a video-rendering backend. Keep 3D rendering/export on a verified capable client unless a separately approved architecture proves otherwise.
- Never assume Render's filesystem is durable for project assets or generated videos.

## 9. Documentation and handoff

- `PROJECT_CONTEXT.md` is the single source of truth for current status, completed work, blockers, test evidence, commits, and the next exact task.
- Update existing documentation in place; do not create duplicate context or architecture documents.
- Update context after each completed work block and include the GitHub checkpoint result.
- Keep `RULES.md` as the canonical execution rules file. If rules change, update this file in place and commit the update; do not create `RULES_v2.md`, `NEW_RULES.md`, or similar duplicates.
- Every handoff must identify the exact repository, branch, HEAD, working-tree state, completed tasks, evidence, blockers, and next action.

## 10. Current execution gate

Before the first source-import work block:
- Verify the approved target repository is still the only write target.
- Inspect My Motion Studio upstream read-only, including license and exact source revision.
- Inspect the target repository's current state and branch availability.
- Plan the import without overwriting existing target content blindly.
- Import only into the approved ToonForge AI repository.
- Complete import verification and push that work block before starting the next block.

**Non-negotiable:** One task at a time. No blind RDC work. No duplicate files or features. No repeated work without evidence-based reason. GitHub push and remote verification after every completed work block, before the next block.