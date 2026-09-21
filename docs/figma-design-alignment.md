# Aligning the app with Figma: how we did it, and where the design artifacts should live

Status: proposal for discussion. Nothing here is decided; the point is to share the process we used in September 2026 for the onboarding redesign and to pick a home for the Figma-derived material before more of it piles up.

## 1. What we set out to do

Quiet's Figma files (13 files, ~400,000 nodes in the account) describe screens that the desktop and mobile apps only partly implement. We wanted a repeatable way to (a) see what the designs actually say, in numbers, not screenshots, (b) review the designed flow and the implementation side by side, and (c) land the implementation as small stacked PRs that reviewers can try in a real build.

## 2. The process, in the order it ran

### 2.1 Crawl the account into a local index

A small Python script walks every team/project/file the token can see, streams each file's JSON to disk, and parses it into narrow SQLite tables: `files`, `pages`, `frames` (103,807 rows), `components`, `instances`, `text_nodes` (57,350: family, style, size, weight, line height), `paints` (252,959 fills/strokes), `layout` (116,940: padding, item spacing, corner radius), `styles`. The index is 88 MB and is what let us ask questions like "which spacing values are actually used" instead of eyeballing frames.

Findings this produced, which drove decisions:

- Spacing: 160 distinct `itemSpacing` values across 57,319 auto-layout frames; in the onboarding files only 67% sit on a 4 px multiple and `10px` alone is 21.5% of them. We adopted a 4 px grid and accepted that the tightening is visible.
- Type: `caption` and `body2` in `theme.ts` were each 4 px of leading off the values Figma uses thousands of times; `h1` had line-height smaller than its font size.
- Weights: only Rubik 400 and 500 are bundled; anything asking for 600/700 renders faux-bold.

### 2.2 Extract the prototype flow and export the frames

For each prototype file, `flow/extract.py` reads the cached file JSON, follows the prototype links (so the click-through order is the designer's, not ours), records each frame's title bar, copy, components used and outgoing links, and exports the frames as PNG through the images API. Output: `figma/flow.json` (text) plus one PNG per stage. A generator (`flow/gen.cjs`) turns that into Storybook stories, with a small table of hand decisions layered on top: stages purged as cruft, display names, title-bar overrides, links we added that the file lacks, and which designer-drawn desktop frames to use where the mobile frame is not the desktop answer.

### 2.3 Review Storybook, frozen

The design library lives on the branch `design/storybook-grid` under `packages/desktop/src/renderer/design-system/`. A renderer (`flow/FigmaFlow.tsx`) shows each stage as the mobile frame, or composed into the desktop shell, or as the designer's own desktop frame, with the prototype's hotspots clickable and a viewport switch. Reviewers only ever see a static `build-storybook` output served by a plain file server; a dev server with HMR killed open tabs every rebuild. A gate script renders every story in one headless Chrome via CDP, asserts the expected story ids are registered, and screenshots the changed ones before a link is handed over. The decisions taken while reviewing are written into `ONBOARDING.md` next to the stories, with the Figma node ids they rest on.

### 2.4 Implement as stacked draft PRs, one worktree per agent

Each feature got its own branch, worktree and agent; nobody edits another worktree. The stack as of this writing, all draft, all on TryQuiet/quiet:

| PR | branch | what |
|---|---|---|
| #3512 | `design/onboarding-impl` | base: phase 1 on both platforms, device linking from #3400 |
| #3514 | `design/onboarding-entry` | Get started, Recover account, join with invite link |
| #3521 | `design/h1-no-bar` | no top bar on full-screen h1 stages |
| #3524 | `design/agree-and-join` | Agree & join, button label weight, Continue pills |
| #3525 | `design/joining-progress` | Tor vs server progress screens |
| #3516 → #3519 | `design/onboarding-qr-scan` → `design/link-devices-paste` | desktop QR scanning; Paste link, Link devices by direction |
| #3520 | `design/mobile-qr-scan` | camera scanning on mobile |
| #3515 | `build/android-x86_64` | x86_64 Android build so the backend runs on the emulator |
| #3517, #3518, #3523, #3526 | audit, progress states, join illustration, desktop sidebar | side branches |

### 2.5 Demo builds from a throwaway merge

Two local branches, `demo/stack` (desktop) and `demo/x86-stack` (Android), merge every feature branch at a known sha. Each build goes to a new filename (`Quiet-demo-<sha>.AppImage`, an x86_64 APK) so a running instance is never overwritten underneath a reviewer. Desktop instances run against a local QSS stack (docker, hCaptcha test keys) so server flows can be exercised without the production captcha. The phone build is installed on the reviewer's emulator only on an explicit go; agents verify on their own emulators first.

### 2.6 Feed decisions back

Everything the reviewer decided while clicking through ("no title bar on h1 screens", "rows follow the direction", "the Tor explanation is for Tor communities") went into `ONBOARDING.md` with the evidence, and, where the Figma file disagreed, a note saying so. The Figma file is the reference; the decisions doc is the diff between the file and what we build.

## 3. What we learned that should shape the tooling

- The designer's notes are part of the design. The "V1 2025 requirements" list sits as a note beside the sidebar components and settled three questions (no search, no dark mode, tapped states) that the frames alone left open. An index of frames without the note text misses this.
- A Storybook canvas hides window-size bugs. The Agree & join card was 636 px tall and rendered fine in Storybook; in the app's 800×540 window its title bar sat above the viewport. Every screen needs one check at the real window size.
- Story ids come from export names, not titles; a static server returns 200 for any `?id=`; the "Couldn't find story" page is a non-blank screenshot. Gates must assert registration, not HTTP status.
- Content-hashed bundle names are not a build identity in Storybook 6.5; identify a build by a stamp the publish step writes.
- Frames drawn for one platform get copied to the other with copy that is false there ("you can exit the app, we'll notify you" on desktop). Check each sentence against what the code does before shipping it.
- One editor per worktree, kill only PIDs you recorded, never overwrite a binary a demo runs from, never drive the reviewer's device. Each of these was learned by breaking it.

## 4. What is checked in today, and where

On `design/storybook-grid` (43 commits over `upgrade/react-native-081`), under `packages/desktop/src/renderer/design-system/`:

| kind | files | size |
|---|---|---|
| PNG exports of Figma frames (mobile stages, desktop frames, progress, device linking) | 70 | 7.5 MB |
| `figma/flow.json`, `figma/desktop.json`, `figma/manifest.json` | 3 | small |
| scripts: `flow/extract.py`, `flow/gen.cjs`, `flow/FigmaFlow.tsx`, `flow/implementation.ts` | 4 | small |
| `ONBOARDING.md` (decisions, stage-by-stage notes, audits) | 1 | ~60 KB |
| tokens, specimens, screens, theme, primitives | 10 | small |

Not checked in anywhere: the crawler and its 88 MB index, the gzipped raw file JSON (deleted; regenerable), the Figma token, the gate and publish scripts, the demo build recipe. They live in one person's home directory and a session scratchpad, which is the problem this document is about.

## 5. Options for where the Figma work lives

The material has three parts with different properties: **text** (flow JSON, node ids, decisions, scripts; small, diffable, the durable value), **derived binaries** (PNG exports; regenerable from the API given a file version), and **bulk derived data** (the index and raw JSON; 100 MB+, regenerable, useful for questions, not for review).

### Option A. Keep everything in the app repo, as now

Exports, flow JSON, decisions and scripts under `design-system/`, Storybook builds from them.

- For: one PR shows design reference and implementation together; no second repo; the Storybook build has everything it needs offline.
- Against: every re-export adds new PNG blobs to history forever (7.5 MB today; a second flow doubles it); design assets have their own ownership and licence questions; the index and raw JSON can never go here.
- Mitigation: Git LFS for `design-system/figma/**/*.png` (the repo already uses LFS for `NodeMobile`), export at 1× only, and a small lock file naming the Figma file key, its `version` id and the node ids, so the PNGs are reproducible rather than precious.

### Option B. A separate design repo (for example `TryQuiet/design`)

Holds exports, flow JSON, decisions, the crawler, the index as a release artifact, and the raw JSON cache. The app repo consumes a pinned snapshot: a git submodule, an npm package, or a script that fetches a tagged tarball at Storybook build time.

- For: the app repo's history stays small; designers and product can open PRs against decisions without touching app code; the index and cache have a home; one place to point Codex or any other tool at.
- Against: two repos to keep in step; submodules are already a source of pain in this monorepo (the `3rd-party/` pins); a PR that changes a decision and its implementation now spans two repos; Storybook builds need network or a vendored snapshot.

### Option C. No binaries in git at all

Commit only text: scripts, flow JSON, node ids, decisions, and a lock file with the Figma file `version` ids. Fetch PNGs from the images API at Storybook build time; the token is a CI secret.

- For: tiny footprint; nothing derived is committed; the file version pin makes exports reproducible even after the Figma file changes.
- Against: builds depend on Figma being up and the token being present; local contributors without a token cannot build the review Storybook; a Figma account change (files moved, token revoked) breaks history retroactively.

### Option D. Hybrid: text in the app repo, binaries in LFS, bulk data published by CI

Text and scripts in `design-system/` as now. PNGs in LFS with the lock file from A. The crawler runs on a schedule in CI (or in the design repo from B) and publishes `index.db` as a workflow artifact or release asset; nobody commits it.

- For: the review Storybook builds offline from a checkout; history stays small (LFS pointers); the index exists for anyone with repo access without a token; the API is hit once per crawl, not per build.
- Against: LFS bandwidth quotas on GitHub; contributors need `git lfs` installed; two mechanisms (LFS and artifacts) to explain.

### Option E. Publish the review Storybook itself

Independent of A–D: put the frozen static build somewhere reviewers can open without a tunnel to one machine. Chromatic is already wired for the desktop Storybook; GitHub Pages or an S3/R2 bucket per branch also works. This is where the "please review these screens" links should point, not at `localhost:6006`.

## 6. Recommendation

D plus E, in this order:

1. Move `design-system/figma/**/*.png` to LFS now, while it is 7.5 MB, and add `design-system/figma/figma.lock` (file key, `lastModified`, `version`, node ids, scale, sha256 per export). `extract.py` already knows every node it exported; writing the lock is a few lines.
2. Check in the crawler and the gate/publish scripts under `packages/desktop/src/renderer/design-system/tools/` so they stop living in a home directory. The token stays out of git; document the env var.
3. A weekly workflow runs the crawler and uploads `index.db` as an artifact. Anyone with repo access downloads it; Codex and similar tools read it locally.
4. Publish the frozen review Storybook per branch through Chromatic (already configured) and link to it from PRs.
5. Keep `ONBOARDING.md` as the decisions log, split per flow as flows are added (`decisions/onboarding.md`, `decisions/sidebar.md`), each entry with the Figma node id and the date. The design library's designer notes should be extracted into the same place when a flow is imported, since they are where the requirements were.

Option B becomes worth it if a second consumer of the design material appears (a website, another client, a docs site). Until then the split costs more than it saves.

## 7. Open questions for the group

- Do we want the Figma exports to be reviewable in PR diffs at all, or is the lock file plus a Chromatic link enough?
- Who owns `ONBOARDING.md`-style decisions when the designer disagrees with a change we recorded? Today the file is the reference and the doc is the diff; that should be a shared rule, not one person's habit.
- Is a scheduled crawl of the whole account acceptable to the design team, or should it be scoped to named files?
- Should the demo build pipeline (throwaway merges, local QSS, AppImage per sha) become a CI job with artifacts, so reviewers do not depend on one machine?

## Appendix: how to regenerate everything

- Index: `FIGMA_TOKEN=… python3 figma_crawl.py` (writes `raw/<key>.json.gz` and `index.db` beside itself).
- Flow and exports: `FIGMA_TOKEN=… python3 flow/extract.py <cache-dir> figma/` then `node flow/gen.cjs`.
- Stories: `npm run build-storybook` in `packages/desktop` (`NODE_OPTIONS=--openssl-legacy-provider`), serve the output with any static file server, run the gate before sharing a link.
- Exact node data for one component: `GET https://api.figma.com/v1/files/<key>/nodes?ids=<id>` with `X-Figma-Token`; add `&version=<id>` to pin a file version.
