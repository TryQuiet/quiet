# Low-hanging-fruit rounds: a repeatable workflow

A "round" takes the open issue backlog, finds the fixes that are quick, easy to verify and
low-risk, and lands them as a batch of small, independent, visually reviewable draft PRs. One
lead (a person, or an agent supervised by a person) triages, dispatches one fixer agent per
issue, verifies every result independently, and tracks the round in a meta PR.

This document is written from the first round, run on 2026-09-11 against
`origin/develop @ 1ed08d8fb`. The numbers and the mistakes below are that round's.

## Outcome of the first round

| Stage | Result |
|---|---|
| Issues read | 693 open |
| Ranked as low-hanging | 49 (value × ease) |
| Pursued by agents | 25 (5 to calibrate, then 20 in parallel) |
| Draft PRs opened | 22 (`small fixes`, base `develop`) |
| Issues closed with evidence, no code | 6 (five fixed years ago and never closed, one duplicate) |
| Withdrawn on a product decision | 1 (dock unread badge: no per-message unread counts exist) |
| Dropped for an existing contributor PR | 2 (one approved PR adopted, one rebased for the author and merged) |
| Bugs found on the way, not fixed | ~10, listed in the meta PR |

The first round tracked results in local HTML reports and only moved to PRs at the end. The
process below uses PRs from the start; that is the main change from what was actually run.

## 1. Triage

Read every open issue once. An issue qualifies only if it clears all four bars:

1. **Quick**: hours, not sprints; usually one file or one component.
2. **Easily verified**: a screenshot, a short recording, or an existing unit test settles it. No
   multi-peer choreography.
3. **Low QA churn**: does not touch sync, crypto, joining or transport, so a green suite is
   meaningful evidence rather than a coincidence.
4. **Low blast radius**: cannot plausibly introduce a security hole, data loss or a reliability
   regression.

Score each survivor: **value** 1–5 (stability feel, universality in messaging apps, user pleasure,
weighted equally) times **ease** 1–5. Sort by the product, not the sum; a trivial 2-value fix
should not outrank a table-stakes 5-value one that takes a day.

Mark every row with how much you actually checked:

- ✅ **Verified**: read the code on `origin/develop`, confirmed the bug is still there and where
  the fix goes.
- 🔍 **Located**: found the subsystem, did not read every line.
- ❔ **Unverified**: triaged from the issue text only.

Verify against `origin/develop`, never a local checkout. The first round's local branch was 256
commits behind and would have produced wrong file:line citations for a third of the list.

The triage document has four sections: **free wins** (already fixed; see the closure policy),
the **ranked table**, **deliberate exclusions** (high value but not low-hanging, listed so their
absence is not mistaken for an oversight), and a **suggested first pass**.

### Closure policy for issues that are already fixed

- Fixed before the current release line started → close as **completed**, with a comment that
  names the fixing commit, its date, the first tag that shipped it, and how you verified it on
  `origin/develop` (a probe test, a grep, a screenshot).
- Fixed inside the current release line → move to **ready for QA** instead of closing.
- Fixed after the shipped release → leave open until it ships.

Six of the first round's 25 "fixes" ended this way. Finding that an issue is stale is a success,
and the evidence comment is the deliverable.

### Pre-flight against open PRs

Before dispatching anything, map every ranked issue to open PRs (`gh pr list --search
"<number>"`, plus a body grep, because the search misses references). Rules:

- An issue with an **approved or active contributor PR** is off the list. If the PR is merely
  stale, rebase it *for* the contributor (`maintainer_can_modify` allows pushing to their branch),
  keep their commits, put their changelog entry where it now belongs, credit them by handle, and
  thank them. Do not open a competing PR.
- An issue with an old abandoned PR is fair game; credit the PR in the commit body if you reuse
  its idea.

The first round skipped this step and spent an agent on an issue that had an approved PR.

## 2. Environment

The lead needs a checkout whose test baseline is **proven**, and each agent needs an isolated
worktree that cannot damage anyone else's.

### The lead checkout

- A separate worktree of the repo with its **own copied** `node_modules` and its own built
  `packages/*/lib`. Never symlink `node_modules` or build output into a checkout someone else
  uses; writes go through symlinks.
- Run every package's full suite once before anything else and write the numbers down. If the
  baseline is red, find out why before dispatching. The first round's baseline showed 21 failing
  desktop suites, all self-inflicted: installing a missing dependency had pulled `react@19` into
  the repo root, where the repo deliberately has no React. Until the absolute baseline is trusted,
  every agent must report **differential** evidence (same command, same environment, before and
  after) rather than absolute counts.
- Expect to find real breakage. `BasicMessage.test.tsx` had been failing on `develop` for four
  months over a one-character snapshot; nobody had noticed because CI on that path was skipped.

### Per-issue worktrees

One worktree per issue, one branch per issue, all from the same base SHA. A creation script
(`mkwt.sh <issue> <slug>`) should:

- `git worktree add -b fix/<issue>-<slug>` from `origin/develop`;
- create `node_modules` as a directory of **per-entry symlinks** into the lead checkout, with
  `@quiet/*` pointing at the worktree's own `packages/*` so an agent's change to a shared package
  is what its desktop or mobile tests see;
- copy the prebuilt `lib/` of each shared package in (gitignored), so nothing needs building
  unless the agent changes that package (then it runs `npm run build` there and says so);
- link only the built `dist` of any submodule the type packages import;
- make `react-native/jest-preset.js` and `react-native/jest/` **real copies**: Node resolves a
  symlinked preset to the shared tree, and the asset transformer then records `testUri` paths
  relative to the wrong tree, which fails every snapshot with a PNG in it.

### Toolchain facts that must be in every prompt

- Exact test commands per package. For mobile: `--testPathIgnorePatterns="./e2e"
  --transformIgnorePatterns "./node_modules/(?!@d11/react-native-fast-image)/"`, and the test
  pattern goes in `--testPathPattern=`; a trailing positional after an array flag is swallowed
  and silently runs the whole suite.
- A dedicated Xvfb display per agent for headless Cypress component screenshots
  (`DISPLAY=:30x npx cypress run --component --browser electron`); the shared display collides.
- `--maxWorkers=N` for full runs, and never two full suites at once in one worktree: CPU
  contention produces spurious `waitFor` timeouts that look like regressions.
- **Never `git stash`.** `refs/stash` is one ref shared by every worktree of a repo; with twenty
  agents, `stash pop` hands you someone else's work. Save WIP with
  `git diff > wip.patch && git checkout -- .` and restore with `git apply`.

## 3. Dispatch

Start with **five issues of representative difficulty** to calibrate the prompt and the
environment, then scale out. Twenty agents in parallel was fine on a 32-core machine once the
`maxWorkers` rule was in place. Use a cheaper model for the fixers and reserve the stronger one
for the lead's verification; the lead's judgment is where the quality comes from.

Each agent gets one issue and a prompt with these sections, in this order:

1. **Environment**: worktree path, branch, base SHA, "do not install, do not write under
   `node_modules`, do not touch the live checkout, do not push, no stash", scratch directory,
   read-only GitHub access.
2. **Verified toolchain**: the exact commands above, the known pre-existing failures to ignore,
   the display number.
3. **Method**: demonstrate the defect on unmodified code first (a failing test or a "before"
   screenshot); if it does not reproduce, stop and report **STALE** with the fixing commit, which
   is a success; smallest correct change; no new dependencies; prove it; run the full suite of
   every package touched; self-review the diff line by line; `git diff origin/develop --stat`
   must show only this issue's files; commit with a body that explains *why*; no half-fix
   commits, a well-argued defer is a success.
4. **The issue**: the text, plus every fact the lead verified (file:line on `origin/develop`,
   existing helpers to reuse, call sites, the mechanism if known). This section is what makes
   one-try landings possible; the more the lead has verified, the less the agent guesses.
5. **Deliverable**: the PR description format from section 5.
6. **Final line**: `STATUS: DONE|STALE|DEFERRED|BLOCKED — <summary>`.

Two rules about communication with agents:

- **Demonstrate, do not describe.** An agent in the first round ignored two prose warnings about
  a `NaN` rehydration bug and committed anyway; a failing test attached to the same message was
  acted on immediately. The same applies in the other direction: an agent's claim is not
  evidence, its failing-before/passing-after output is.
- **Surface product questions; do not settle them.** Agents flagged the profile-photo size limit,
  a leading-space username rule and the meaning of an unread badge. Each went to the maintainer,
  who decided within minutes (compress to 200 KB; keep the space rule; withdraw the badge). An
  agent deciding any of those would have cost a review round.

Do not assign issues that need a device, a design file you cannot open, or a protocol change.
Leave them in the exclusions table with the reason.

## 4. Verification by the lead

Nothing goes into a PR on an agent's say-so. For every result:

- Read the diff. Check it is one commit (or a deliberate stack of two), the worktree is clean,
  the commit footer is uniform, and the file list contains nothing outside the issue.
- Re-run the tests the agent cites, and the full suite of any touched package if the agent's
  numbers look off. Agents in the first round were honest about their numbers, but their
  *environment* was sometimes wrong (the `testUri` artifact made every mobile suite look red to
  them); the lead is the one who can tell the difference.
- For screenshots, check the files exist and the before/after actually differ in the way claimed.
- For "stale" verdicts, check the fixing commit is an ancestor of `origin/develop` and date it
  against the release line for the closure policy.
- When a repro attempt finds nothing, **validate the detector against the reporter's own
  screenshot** before accepting the null result. The uneven-sidebar issue was invisible to
  geometry sweeps and only fell to pixel analysis of the attached image, which then pointed at the
  commit that had already fixed it.
- When a platform is needed (a Mac for a dock badge), reach it over SSH and read state through
  the OS rather than screenshots where the screen is locked (`lsappinfo` for dock badges). Patch
  an existing built checkout instead of bootstrapping the whole tree. Never `open` an Electron
  bundle from the shell on macOS; Gatekeeper moves it to the Trash.

If the lead's process dies mid-round (it did), back up every worktree's uncommitted changes as a
patch before touching anything, then hand each unfinished issue to a fresh agent with the patch
and the instruction to **review the inherited work critically rather than trust it**. Two of the
nine resumed agents corrected the inherited approach.

## 5. Reporting and tracking: the PR is the report

Do not build a parallel reporting system. Each fix is a **draft PR** from the first commit, and
the PR description *is* the report. Reviewers already have the diff in the Files tab, so the
description never repeats code.

### PR description

```
Fixes #<issue>            (or "Refs #<issue>" for a test-only guard)

**Status**: FIXED | STALE (closing) | DEFERRED — one line

## What was wrong
One paragraph, exact file:line on the base SHA, and what happens today.

## Why this fix
Two or three sentences: the mechanism, the alternative rejected and why.

## Evidence
- Tests: which ones fail on unmodified code, which pass after; full-suite before → after
  numbers for every touched package; snapshots updated (count, and why each).
- Screenshots: before and after SIDE BY SIDE (see below).
- For motion: a GIF if you can capture one, otherwise the exact story to open on device.
- Anything that could not be verified here, and the 30-second manual check that would.

## Risk
What could break, every call site checked, product questions that need a decision.

## Reviewer checklist
Two to four bullets a human can confirm in under a minute.
```

### Make it visual

- Put before/after in a two-column HTML table so they sit next to each other:

  ```html
  <table><tr><th>Before</th><th>After</th></tr>
  <tr><td><img src="…/before.png" width="420"></td><td><img src="…/after.png" width="420"></td></tr></table>
  ```
- Crop and zoom for one-pixel issues; a full-window shot hides a 1px seam.
- Light and dark mode both, when the change touches colour.
- Long logs go in `<details>`; the numbers go in the body.
- Alt text and a caption per image; a reviewer on a phone should still get the point.

### Hosting the images

GitHub's API cannot upload images to a PR body. Push them to an **orphan evidence branch**
(`evidence/<round>`) before opening the PRs and reference them by
`https://raw.githubusercontent.com/<org>/<repo>/evidence/<round>/<issue>/<file>.png`. The
branch holds nothing but PNGs and a README; it never merges. Keep it until the round is done;
after that, either keep it (it is tiny) or drag the key shots into the merged PRs by hand before
deleting it, because raw links die with the branch.

### Labels

- One label per round (`small fixes` in the first round). It is how the meta PR, the reviewers
  and `gh pr list --label` find the batch.
- `needs-decision` on any PR carrying an open product question (the 200 KB limit, the unread
  badge). The lead removes it when the maintainer answers, and records the answer in a comment.
- Test-only guards say so in the title (`test(desktop): …`) and use `Refs`, not `Fixes`.

### Meta PR

Open one **meta PR** per round, from a `docs/` branch carrying `docs/rounds/<date>-<name>.md`.
Its description is the round's dashboard:

- the table of issue → change → area → PR;
- merge notes: base branch, which PRs need a shared-package rebuild, which pairs touch the same
  file, where the changelog entries go;
- issues closed with evidence, and duplicates;
- bugs found but not fixed, as a list to file;
- decisions taken by the maintainer, with dates.

Progress is tracked in the meta PR's comments (merged / closed / needs decision / superseded),
and the meta PR merges last as the record of the round. When a round is folded into a larger
effort, a comment on that effort's meta PR carries the same table.

### Closures and contributor PRs

Post the evidence comment and close from the same session that verified it, but expect the
tooling to require a human for anything outward-facing: commenting, closing, approving fork CI
runs and admin merges were all gated or unavailable to the token in the first round. Prepare the
comment files and the exact commands so the human's part is one line.

## 6. Avoiding conflicts, and never letting one PR block another

The batch is only useful if any subset can merge in any order.

- **Same base, one issue per branch.** Every branch starts from the same `origin/develop` SHA,
  which is written in the meta PR.
- **Pairwise overlap check before opening the PRs.** For every pair of branches, intersect
  `git diff --name-only <base>..HEAD`. Put the resulting matrix in the meta PR. The first round
  had exactly one overlap (`main.ts` / `main.test.ts` between the power-save and window-size
  fixes), noted as "rebase whichever lands second".
- **No shared-file edits in the drafts.** The repository checklist asks for a changelog entry per
  PR, but 22 drafts editing the same section is a 22-way conflict. Leave changelog entries out of
  the drafts and either add each at merge time or let the meta PR carry the whole block.
- **Additive changes to shared packages.** A fix that needs `packages/common` or
  `packages/state-manager` adds an export; it does not rename or reshape one. Three PRs in the
  first round touched shared packages and none conflicted with another.
- **Stack only for a real dependency, and keep stacks two deep.** The profile-photo compression
  sits on the size-guard commit in the same PR because it cannot exist without it. When a child
  must be its own PR, base it on the parent branch so GitHub retargets it on merge, and say so in
  both descriptions. Anything else stays independent, so a PR found not ready simply stays a draft
  and nothing waits for it.
- **Rebase right before "ready for review".** Drafts drift; a rebase onto `develop` immediately
  before flipping the state keeps CI honest and the merge button green.
- **Merge order** is therefore: independent PRs in any order, stacked pairs parent then child,
  the meta PR last.

## 7. Hazards met in the first round

Keep this list growing; each item cost real time once.

| Hazard | Symptom | Rule |
|---|---|---|
| Dependency injected into the repo root | 21 red suites, `useContext` of null | Never `npm install` into a tree that is symlinked anywhere; place deps in the package that needs them |
| Shared `refs/stash` across worktrees | Agents popped each other's work | Patch files only |
| Symlinked `react-native` jest preset | Every mobile snapshot with a PNG fails on `testUri` | Real copy of `jest-preset.js` and `jest/` per worktree |
| Jest positional after an array flag | Whole suite runs, pattern ignored | `--testPathPattern=` |
| Two full suites in one worktree | Spurious `waitFor` timeouts | `--maxWorkers`, serialise full runs |
| Lead process crash | 20 agents gone, 9 worktrees dirty | Back up patches, resume with critical review |
| Unannounced staleness | Agents "fix" behaviour that already works | Demonstrate the defect first; STALE is a success |
| Geometry sweeps for a pixel bug | False null repro | Validate the detector on the reporter's screenshot |
| Electron 31.7.7 on macOS 26 | Binary hangs in dyld (Apple revocation) | Use a current Electron for platform probes |
| `open Electron.app` from SSH | Gatekeeper trashes the bundle | Launch the binary directly |
| Fork PR CI | Runs sit at `action_required`, token cannot approve | Ask a human; do not admin-merge around CI without a decision |

## 8. Checklists

**Lead, before dispatch**
- [ ] Triage doc written; every ranked row carries a verification mark
- [ ] Open PR sweep done; contributor PRs adopted or rebased rather than duplicated
- [ ] Lead checkout baseline proven for every package, numbers recorded
- [ ] Worktree script produces a green baseline in a fresh worktree (including mobile snapshots)
- [ ] Evidence branch created; round label created; meta PR branch created

**Per agent prompt**
- [ ] Environment, toolchain, method, verified issue facts, deliverable format, STATUS line
- [ ] No-stash, no-install, no-push, scope-check rules present
- [ ] Display number and scratch directory unique to the agent

**Per result, before the PR leaves draft**
- [ ] Diff read; one commit; clean worktree; only this issue's files; uniform footer
- [ ] Tests re-run by the lead; screenshots exist and show the claimed change
- [ ] Description follows section 5; images side by side; product questions labelled
- [ ] Overlap matrix updated; changelog left for merge time

**Round close-out**
- [ ] Meta PR description current; comment on the parent effort's meta PR if there is one
- [ ] Stale issues closed with evidence; duplicates closed
- [ ] Follow-up bugs filed or listed
- [ ] Worktrees and Xvfb displays cleaned up; evidence branch fate decided
