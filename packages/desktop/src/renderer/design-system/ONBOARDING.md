# Onboarding — design spec for implementation

Generated 2026-09-11 from the Figma prototype **Get started (prototype)** (`f6Nr5b5wtvk6Xoh1HJZ8Dd`, last edited 2026-04-14) and the shipping code on branch `design/storybook-grid`. Extended 2026-09-13 with the join tail of a second prototype, **Join from invite link + prototype** (`dSEZJr9crJjcV3ILogea9C`, page *Draft 1* `7:2510`, last edited 2025-02-04) — see *Join from invite link* below. Every string under *Copy* is the designer's text node, verbatim. Nothing here is invented; where the design is silent it says so.

## Framing (decided 2026-09-12)

Storybook **is the new design library**, being rebuilt from this spec: one design — 4px grid, the Rubik scale, mobile-canonical layout, `Modal full-window` on desktop — scoped to features that exist in the code or are in branches now. There are no before/after or 2px comparisons in Storybook; `design-system/tokens` exports a single `tokens` set. Stories are library entries: `Foundations/*`, `Components/*`, `Screens/*`, `Onboarding flow`, `Desktop — designs`.

## Decisions already made

- **No top bar title on full-screen h1 stages (user, 2026-09-13, from the prototype):** on mobile the frames with a large heading (Join community, Open invite link, Paste a link, Create a community, Choose username, Link devices, Account recovery, Want a server?…) hide the bar's title — only the back/close glyph shows and the h1 is the title; there is no bar line. Only sheets (QR code, Scan QR code, Join with QR code) and the username screen show a titled bar with a divider. The apps must follow this on mobile (no Appbar title/divider on those screens) and on desktop (the Modal full-window shell shows the back arrow but no title text on them — see the Device-linking desktop frames). The extractor now records hidden titles as `hiddenTitle`; the click-through's shell composition shows no title and no divider for them. Implemented (`design/h1-no-bar`): desktop `ui/Modal` `withoutTitle` — the 60px bar zone keeps the glyph, no title text, no hairline — on Join community's steps (Join community, Account recovery, Open invite link, Paste a link), Create a community and Choose username; mobile `Appbar` `withoutTitle` — the 60 bar zone with the glyph box 28 at (14, 16), icon 16 — on the same screens, content top-anchored 24 under it; Link devices follows here too (merge-up, 2026-09-21): the rule is applied wherever a screen carries a large heading, so the bar title goes from Link devices (2811:2575), Display QR code (2811:2601, heading "Linked devices"), Scan QR code (2811:2587) and Join with QR code (2811:2460) as well — the prototype draws those four as titled sheets, but in both apps they are full screens that repeat the bar's words as their heading, and no screen shows a bar title above a heading. Desktop `LinkDevices` and Join community's QR step pass `withoutTitle`; mobile `LinkDevices` and the two QR variants of `JoinCommunity` do the same. The Storybook captions say which title was dropped and why (`droppedBar`), as distinct from the ones the frame itself hides (`hiddenBar`). The frames are not uniform about the hairline (Choose username 2811:2371/2373, Create a community with photo 2811:2366 and Want a server? 2922:10009 still draw the #F0F0F0 line under the glyph; Join community, Open invite link, Paste a link, create--default, Link devices and Account recovery do not): the rule 'no top bar' is applied uniformly and the line is dropped on all of them.
- **No "Quiet" header on Get started (user, 2026-09-13):** the prototype's Get started frame (`2811:2550`) and the Dec-2024 desktop *Modal full-window* Get started both carry a title bar reading "Quiet"; it is redundant with the app window on desktop and doesn't feel right on mobile, so the app renders Get started **without a title bar** on both platforms (content starts under the window chrome / at the safe area). The prototype exports still show it; the desktop composition in the click-through drops the bar for this stage (`flow/gen.cjs` `TITLE_BAR`). Superseded the same day: the prototype hides the bar title on every full-screen h1 stage (Join community's "Quiet" included) — see the decision above; titled bars remain only on sheets and the community home header.

- **A failed join is reported on the Paste a link screen (user, 2026-09-22):** whatever goes wrong with an invite link — text the client cannot parse, or the backend's verdict after admission — the message is the field's own error line, **under the input on the same *Paste a link to join* screen**. The flow never navigates somewhere else to say it: not to *Get started*, and not back to the *Join community* three-way choice, which has no field to carry the message. Editing the link takes the message away and keeps what was typed. The copy is unchanged: *Please check your invite link and try again* for a link the client cannot parse (`InviteLinkErrors.InvalidCode`, also used for a QR code that is not an invitation), and for the backend's four — *This invite is invalid or has expired. Please try again.* (`INVALID_INVITE`), *Joining was interrupted when Quiet went to sleep. Please try again.* (`ADMISSION_INTERRUPTED_RETRY`), *Joining timed out. Please try again when other peers are online.* (`COMMUNITY_ADMISSION_TIMEOUT`) and *Joining timed out. Please try again and make sure both devices have the app open.* (`DEVICE_ADMISSION_TIMEOUT`). No frame draws this state. Desktop `JoinCommunity.tsx` reopens the modal on the paste step and passes `fieldError`/`onFieldChange` to `PasteLinkComponent`; mobile clears the invitation and resets to the paste screen with the path it would have been walked underneath (`resetAdmission.saga.ts` `ADMISSION_FAILURE_STACK`), the message arriving as the `inputError` prop. Stories: Screens/Onboarding → *Paste a link to join · invalid invite*, *· admission timed out*.

- **Spacing grid: 4px** — steps 4 8 12 16 24 32 48 64; semantic roles xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 (`design-system/tokens/grid-4px.ts`).
- **Type scale (Rubik, weights 400/500 only)**: overline 10/16 w500 · caption 12/16 · body 14/20 · subtitle 14/20 w500 · bodyLg 16/24 · h5 16/24 w500 · title 20/28 w500 · h3 28/36 w500 · h2 32/40 w500 · h1 48/56 w500. Adopting it is component work: 39 desktop files hardcode `fontSize`; `TextMessage.tsx`/`BasicMessage.tsx` use no theme variants.
- **Join community becomes a three-way choice**: *Join with invite link* / *Join with QR code* / *Recover account* — replacing the single paste field both apps ship.
- **Storybook first, then implement.** Stories live under `packages/desktop/src/renderer/design-system/`; new stories set `chromatic: { disableSnapshot: true }`. Reviews get a frozen static build gated by `/mnt/storage/holmes-tmp/sb-publish.sh` + `sb-gate.sh`, then an agent check.
- **No invented screens or copy.** Real components, or the designer's exports/text.
- **Base branch**: stack on the RN 0.81 line (`upgrade/react-native-081` → `upgrade/react-native-new-architecture-node`), not on `develop`. Bring in `feat/2610-device-linking` (#3400) by merge; align to its vocabulary: `DeviceLinkInvite`, `deviceLinkUrl`, `LinkedDevices` (desktop Settings tab), `LinkedDeviceQRCode` (mobile screen), strings “Generating device link…”, “Device link unavailable”.

## Layout canon (decided 2026-09-11)

**The mobile prototype is canonical** for layout, alignment and copy. Desktop = the same 375-wide content column centered inside the `Modal full-window` shell. Measured in the file: 26 of the 30 onboarding screens have a **centered** title (the exceptions are iOS crop-screen "Done" buttons and in-app chrome — channel names, the plan card, the iOS share sheet). Rule for every onboarding screen, both platforms: centered title and subtitle; centered illustration where one exists (exported as SVG, never redrawn); full-width action rows / inputs / primary button below; the beta caption at the bottom of the entry screen. The older Dec-2024 desktop frames and the app's current desktop modals are left-aligned and are **not** followed.

## Vertical rhythm (decided 2026-09-22)

Moving between onboarding screens jumped vertically — Get started sat much lower than the Join community it leads to. Two causes, both in the code rather than the frames, and one deviation in a frame.

**The frames.** Every full-screen stage is a 375-wide frame with a **60-tall bar zone** at the top and puts its **first content element 24 below that zone** — the illustration where the screen has one, otherwise the heading. Measured off the exports in `figma/`:

| Frame | Node | First element | Top | Inset below the bar zone |
| --- | --- | --- | --- | --- |
| Get started | `2811:2550` | logo, 120 | 84 | 24 |
| Join community | `2811:2562` | heart-chat graphic, 219×160 | 60 | **0** |
| Link devices | `2811:2575` | heading | 84 | 24 |
| Account recovery | `2811:2535` | key glyph, 64 | 84 | 24 |
| Join with invite link | `2811:2455` | illustration, 120 | 84 | 24 |
| Create a community | `2811:2451` | heading | 84 | 24 |
| Choose username | `2811:2371` | heading | 84 | 24 |
| Paste a link to join (WIP) | `3190:10892` | heading | 84 | 24 |
| Want a server? | `2922:10009` | server glyph | 84 | 24 |

Eight frames agree on 24; **Join community is the one deviation**, its graphic flush against the bar zone. It is not marked WIP, and the pull-up is probably deliberate — the graphic is the tallest in the set, so starting it 24 higher brings its heading back near Get started's. It is still the odd one out, and it is half of what made the two screens one tap apart land 76 apart, so **the class standard wins and Join community takes the same 24**. Worth putting back to the designer; if the graphic is meant to hang flush, the right answer is a shorter graphic, not a per-screen inset.

Three more classes, none of which takes the stage rhythm:

- **Sheets** — a **titled bar with a hairline**, content **16** below it (`2811:2601` Display QR code, `2811:2587` Scan QR code, `2932:3707` Add members QR, `add-members-options`). The camera sheet `2811:2460` is flush, the camera filling the panel. Unchanged by this pass; desktop draws sheet content at 24 rather than the frames' 16, a known 8px gap.
- **The Agree & join card** (`agree-and-join`, `3054:4090`) — a titled, ruled bar and a **left-aligned** block starting **16** below it, not the centred column the stages use. It is a consent card, and the left alignment is the frame's.
- **Joining now!** (`globe-animation`) and the other progress screens — full-bleed, no bar zone at all, the animation starting at the top edge. Desktop's loading panels keep `Modal withoutHeader` for exactly this reason.

**The standard, both platforms.**

| | Measure |
| --- | --- |
| Bar zone, every full-screen stage | 60 |
| First content element below it | 24 (`xl`) |
| Block to block inside the column | 24 (`xl`) |
| Sheet content below its titled bar | 16 (`lg`) |

Every full-screen stage puts its first element at **y 84**. Desktop: `components/Onboarding/onboardingRhythm.ts` and `OnboardingBody`, which no screen overrides — the `flushLeading` escape hatch is gone. Mobile: `styles/const/onboarding.ts` and `components/OnboardingBody`, which the stage screens render or spread into their `KeyboardAvoidingView`. `components/Onboarding/onboardingRhythm.test.tsx` (desktop) sweeps every `Screens/Onboarding` story and `components/OnboardingBody/onboardingRhythm.test.tsx` (mobile) sweeps every stage, so a screen added later is covered as soon as it renders the column.

**The bar zone stays even when the bar is empty.** "No bar title on full-screen h1 stages" (2026-09-13) hides the *title*; Get started additionally has no glyph, since there is nothing to go back to from the entry. Dropping the 60 as well — desktop `Modal withoutHeader`, mobile no `Appbar` at all — is what put Get started's whole block 60 above every screen it leads to, and mobile then centred it on top of that. Get started now renders the zone empty (desktop `Modal withoutTitle`, mobile `Appbar withoutTitle` with no `back`) and top-anchors its column like the rest. Only the loading panels (`StartingPanel`, `TorJoiningPanel`, `ResetFailedPanel`) still drop the zone; they are full-bleed progress screens, not stages.

**What moved.** Desktop, measured off the `Screens/Onboarding` stories (y from the top of the 715 shell):

| Screen | First element | Heading | First row / button |
| --- | --- | --- | --- |
| Get started | 24 → **84** | 168 → **228** | 228 → **288** |
| Join community | 60 → **84** | 244 → **268** | 304 → **328** |
| every other stage | 84 (unchanged) | unchanged | unchanged |

Get started → Join community: the first element no longer moves at all, and the heading and rows go from **76 apart to 40**. The remaining 40 is the two frames' own illustration heights (120 against 160) and is not invented away — the frames do not align headings across this class, and a fixed illustration slot has no support in them.

Mobile took the same two fixes plus three smaller ones the sweep turned up: *Join with invite link* was spacing its blocks 16 where the class and its own frame use 24; *Choose username* set its inset only on the new-user variant, leaving the taken-username variant flush at 0; and that screen's ad hoc child margins (`24` under the heading, `10` above the parsed-name hint, `32` above the button) are gone, so the column's gap spaces it as it already does on *Create a community*. Net effect there: the heading-to-input distance is unchanged at 24, and the button sits 8 tighter.

## The flow as the prototype wires it

30 screens across the two prototype files. 24 of the Get started file's 25 are one connected graph from Get started; the 25th is the joiner-side v1 agree screen, unwired by design. The other five come from *Join from invite link* and hang off the paste screen by an added link. 47 prototype links, 16 inferred back/close, 3 added. Ids are the Storybook story ids under `Onboarding flow`. The back/close inference now skips glyphs the designer hid, which dropped two hotspots that pointed at nothing: the entry screen's bar (`2811:2550`) has no visible back arrow, and the community switcher's second, hidden title bar drew a second one.

```
Get started ─┬─ Join community ─┬─ Open invite link ─(added)─ Paste a link to Join (frame 'Container', WIP)
             │                  ├─ Sheet: Join with QR code (scan)
             │                  └─ recover-account-info ── Link devices / Open invite link
             ├─ create--default ─ (photo gallery → crop) ─ create--populated-focussed ─ username ─ Community home
             │                                                                                     └─ Community switcher ─ Want a server? ⇄ No server?
             │                                                                                                             └─ Choose a plan ─ Agree & join ─ Captcha ─ Click to subscribe ─ App Store
             └─ Link devices ─┬─ Sheet: QR code (display)
                              └─ Sheet: Scan QR code
Agree-and-join (v1, joiner) ─ Captcha          ← drawn, not linked from anywhere

Paste a link to Join ─(added)─ Choose a username (join) ─ — name typed ─ Agree & join (joiner) ─ Joining now!   ← second file
Starting Quiet                                 ← second file, app start, not wired to anything in scope
```

**Where QSS fits, per the design:** creator-side, *after* the community exists (Community home → switcher → Want a server?). Both apps show the offer *during* creation and the joiner ToS *after* username. This is a product decision to make explicitly; phase 1 keeps the shipping timing and records the disagreement.

## Phase 1 scope (implement now)

1. **Get started** entry screen (both apps skip it today): *Let’s get started…* with *Join a community* / *Create a new community* / *Link devices* and the beta warning.
2. **Join community** three-way choice screen.
3. **Open invite link** (explanatory) + **Paste a link to Join** (the WIP frame’s intent: title, one input with placeholder *Link*, *Continue*; keep the title bar, drop the leftover avatar/subtitle from the duplicated create screen — note this in the PR as an interpretation of an unfinished frame).
4. **Join with QR code** sheet (mobile: scan; desktop: scan too — the camera through Electron's permission handler, decoded with jsQR in the renderer; the paste field is offered when the camera is denied or absent, a state the prototype does not draw).
5. **Create a community** (name + *Continue*); **Choose username** with the real helper copy. Community icon upload/crop: **out** (needs an asset pipeline; note as phase 2).
6. **Link devices** entry from Get started → the #3400 `LinkedDevices` / `LinkedDeviceQRCode` surfaces, with the design’s copy on the entry screen. The *Linked devices / No linked devices* list ships (TryQuiet/quiet#3636) on the share direction only — the one with a community, and so a team graph to read the devices from. It says nothing at all until that read comes back, so it never claims *No linked devices* before the app knows. This device is never a row, and a device removed from the account drops out. Whichever way a device link arrives — scanned or pasted — it goes through the device-link consent sheet before anything is linked.
7. **Desktop variants of all of the above** — the prototype is mobile-only (375 wide); desktop = the 600px modal body the app uses, built from the same tokens. Render every screen in Storybook at both widths (the `RealScreens` harness pattern).
8. Apply the type scale to the components touched.

**Out of phase 1 (record as follow-ups):** a recover-account mechanism (none designed; the Account recovery info screen and its two routes are implemented), plans / subscriptions / App Store (no product), community icon crop, moving the QSS offer to post-creation, `Agree-and-join (v1)` joiner screen (unwired).

## Library component → code component

| Figma library component | desktop (`packages/desktop/src/renderer/components/…`) | mobile (`packages/mobile/src/components/…`) | note |
|---|---|---|---|
| Title bar/Logged in (LeftZ · TitleZ · RightZ; Glyph / Back / Close) | ui/Modal.tsx header (modal-based onboarding) | components/Appbar | Appbar is the direct counterpart; desktop has no standalone title bar |
| Button row (icon · label · caret) — the three-way choice rows | ui/List.tsx + MUI ListItemButton | NEW: no row-with-caret component; ChannelTile is the nearest | Build one `ActionRow` per platform, token-driven |
| Button (primary / secondary) | ui/LoadingButton.tsx (MUI Button) | components/Button | Only Rubik 400/500 exist on desktop; design weight 500 |
| Input3.0 · Input title · Caption · Icon left/right | ui/TextField.tsx | components/Input | Caption below input = helper text |
| Avatar · Avatar type · Edit profile avatar · Avatar-action (community icon) | none for community icon (Jdenticon is per-user) | components/ProfilePhoto, components/Jdenticon | Community icon upload/crop = out of phase 1 |
| Community nav row · Community icon states | Sidebar/IdentityPanel | ContextMenu/menus/CommunityContextMenu + ChannelList header | Community home / switcher screens |
| List item | ui/List.tsx | components/ChannelTile |  |
| Divider | ui/Divider.tsx | plain View border (MessagesDivider is a different thing) |  |
| Spinner | ui/Spinner.tsx | components/Spinner |  |
| Sheet (bottom sheets: QR display / scan / link devices) | ui/Modal.tsx or ui/Drawer.tsx | components/ModalBottomDrawer | Desktop: sheets become modals |
| QR code display | Settings/Tabs/QRCode/QRCode.component.tsx | components/QRCode | Display exists on both |
| QR code scan (camera) | Onboarding/qrScanner/QrScannerComponent.tsx (getUserMedia + jsQR; main/cameraPermission.ts narrows the session's media permission to the camera) | none on this branch; check #3400 for a scanner or deep-link only | Mobile scanner may need a camera dependency — verify in #3400 before adding one |
| Icons: Person add · gear · badge2 · caret · check · arrow-up · Close · Back | ui/Icon.tsx + @mui/icons-material | mobile/src/assets/icons (check names) | Map each to an existing icon; do not draw new ones |
| Illustrations: Monster · group illustration on Join community | static asset (export SVG from Figma node) | static asset (export SVG from Figma node) | Export via Figma images API format=svg; never redraw |
| Wireframe text · Placeholder | — (design placeholders) | — | Not UI |

The 25 kept screens use 59 distinct library components (the 39 before the purge used 99, the extra 40 mostly iOS system UI and duplicates); all but at most one are instances from the published Quiet Design Library (98 of the original 99 were remote). The most-used are Divider, icon glyphs, the Title bar zones, Avatar, Button row, Button, List item, Input3.0.

## Screens

One block per screen. *Copy* is verbatim from the frame. *Uses* lists the library components instantiated (count). Story id = `onboarding-flow--<slug>`.

### Get started  ·  `get-started`
Section: Onboarding · 375×667 · node `2811:2550` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2550)

Copy:
- Quiet
- Let’s get started...
- Join a community
- Subtitle
- Create a new community
- Link devices
- ⚠️ Quiet is in beta and shouldn't be used for activities requiring security.

Uses: ButtonIcons (5), Divider (4), Button row (3), caret-black-r (3), Get started (1), Title bar/Logged in (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1)
Goes to: Button row → join-community [prototype]; Button row → create-default [prototype]; Button row → link-devices [prototype]; Glyph → back [back]
Implemented by: desktop `Onboarding/GetStarted.tsx` (opens itself when connected without a community; Join / Create / Link devices return to it) · mobile `screens/GetStarted/GetStarted.screen.tsx`
Departure (decided 2026-09-13, amended 2026-09-22): **no bar title and no glyph on either platform** — the frame's "Quiet" bar is redundant with the app window on desktop, did not feel right on mobile, and there is nothing to go back to from the entry. The **60 bar zone itself is kept**, as on every other stage: the amendment, because dropping it put this screen's whole block 60 above every screen it leads to (see *Vertical rhythm*). Join community and the other onboarding screens keep their bars.

### Join community  ·  `join-community`
Section: Onboarding · 375×667 · node `2811:2562` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2562)

Copy:
- Quiet
- Join community
- Join with invite link
- Subtitle
- Join with QR code
- Recover account

Uses: ButtonIcons (5), Divider (4), Button row (3), caret-black-r (3), Join community (1), Title bar/Logged in (1), RightZ (1), Add (1), Avatar (1), TitleZ (1)
Goes to: Glyph → get-started [prototype]; Content → open-invite-link [prototype]; Button row → sheet-2811-2460 [prototype]; Button row → recover-account-info [prototype]
Implemented by: desktop `Onboarding/JoinCommunityOptionsComponent.tsx` in `CreateJoinCommunity/JoinCommunity/JoinCommunity.tsx` · mobile `JoinCommunityOptions/JoinCommunityOptions.component.tsx` — Recover account opens Account recovery

### Create a community  ·  `create-default`
Figma frame `create--default` · Section: Onboarding · 375×667 · node `2811:2451` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2451)

Copy:
- Create a community
- Name your community and add a custom icon.
- UPLOAD
- Add a name for your community
- Community name
- Caption
- Continue

Uses: Create community (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Edit profile avatar (1)
Goes to: Edit profile avatar → crop-photo-3 [prototype]; Avatar-action → crop-photo-3 [prototype]; Input3.0 → join-photo-name-true-2811-2366 [prototype]; Glyph → back [back]
Implemented by: desktop `CreateJoinCommunity/CreateCommunity/CreateCommunity.tsx` · mobile `CreateCommunity/CreateCommunity.component.tsx`

### Link devices  ·  `link-devices`
Section: Onboarding · 375×667 · node `2811:2575` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2575)

Copy:
- Link devices
- Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.
- Display QR code
- Subtitle
- Scan QR code
- Linked devices
- Label
- No linked devices

Uses: ButtonIcons (5), Divider (3), Button row (2), caret-black-r (2), Title bar/Logged in (1), RightZ (1), Qr code (1), Avatar (1), TitleZ (1), LeftZ (1)
Goes to: Glyph → get-started [prototype]; Content → sheet-2811-2601 [prototype]; Button row → sheet-2811-2587 [prototype]
Implemented by: desktop `#3400 Settings/Tabs/LinkedDevices/LinkedDevices.component.tsx` · mobile `#3400 screens/LinkedDeviceQRCode/LinkedDeviceQRCode.screen.tsx`

**User rule (2026-09-13): no bar title on full-screen h1 stages.** "There are no top bars on mobile on screens with large h1's": a frame with a big heading hides the bar's title — only the back/close glyph, no bar divider; the h1 is the title. Sheets (QR code, Scan QR code) keep a titled bar. Applied here to Link devices and to its paste step (*Paste a link to Join* is a headline) on both platforms (mobile `Appbar withoutTitle`, the paste variant's `titleHidden`; desktop `LinkDevices.tsx` `TITLED_STEPS` — only the sheets carry a bar title); the QR sheet keeps *QR code* (the desktop frame 880:17427 draws its bar without a divider, as the app's Modal does). The other full-screen h1 stages (Get started, Join community, Open invite link, Paste a link to Join, Create a community, Choose username) are the parity pass's job.

**User decision (2026-09-13): the in-app entry is the same full-screen stage, not a tray.** The Device-linking file's Entry points boards (879:14680 mobile, 879:19861 desktop) point both the Get started row and the Communities switcher's *Linked devices* row at the one *Link devices* stage; no sheet/tray variant exists. Mobile: the community menu's *Linked devices* row now navigates to `LinkDevicesScreen` (back pops to the channel list); #3400's `LinkedDevicesContextMenu` tray (Copy link / QR code / Share + the raw link) is deleted with its `MenuName`. Desktop has no community switcher yet, so the in-app entry is Settings → *Linked devices*: the tab shows the same `LinkDevicesComponent` content, and each row opens the Link devices modal straight at its step (`linkDevicesModal` args `{ step }`; back / close from that step leave the modal). The *Removed* state (879:15648) waits for device removal.

**User decision (2026-09-13): desktop Link devices matches the mobile screen and the frames.** Structure from the Device-linking desktop frames (`3RcrYKRTiFY87TpFSqZyj4` Draft 5: `879:20987` no linked devices, `880:17196` with linked devices — exports in `figma/desktop/devicelink/`), copy from this frame (the drafts' row subtitles are dropped). The rows sit in the library's bordered group (1px `#E5E5E5` r16, rows padded 16; `RowGroup bordered`, Link devices only — the other screens' groups are the cross-cutting parity item). The *Linked devices* list the frames draw below the rows is **built** (TryQuiet/quiet#3636), on the share direction only: overline heading (`darkGray` / `gray50` — the frames' `#7F7F7F`) over the library's bordered card, one row per device with the name, hairline-separated, and *No linked devices* in the frames' `#767676` (`gray60`) when the read comes back with none. What the frames draw and this does not: the per-row *Active* subtitle, which the backend does not report and which would read the same on every row it can draw. The list is `undefined` rather than `[]` until the backend answers, and nothing is drawn until then — that silence is what made it safe to ship, since a card that always read *No linked devices* would be false as soon as a device was linked. The frames' trash glyph is not drawn either (#3400 ships no removal). *Display QR code* is disabled without a community, as on mobile. Tokens added: `border04`, `gray60`, `blue02` (desktop `theme.ts`), `border.*` / `gray60` (mobile palette). Implemented by: desktop `Onboarding/LinkDevicesComponent.tsx` · mobile `LinkDevices/LinkDevices.component.tsx`. Story: Screens/Onboarding → Link devices (with the prototype and desktop frames alongside).

**User decision (2026-09-13): a third Button row, *Paste link*.** Not in the frame. It sits under *Scan QR code* with the same anatomy (49 tall, 16/400 label, left icon, right caret, hairline) and the library's link glyph — the ButtonIcons link that *Join with invite link* uses on 2811:2562 — not a text link like *Paste a link* on Open invite link. It opens the existing paste step (*Paste a link to Join*, 3190:10892) under the *Link devices* title bar; back returns to this screen. Pasted there — and in the scanner's paste fallback — only a **device** link is accepted: a member link, or anything else, shows an inline error under the input and nothing is dispatched. Undesigned copy, to be replaced when designed: the row label *Paste link* (sentence case like the rows above it) and the error *This is not a device link. Use the link from Link devices on your other device.* Implemented by: desktop `Onboarding/LinkDevicesComponent.tsx` + `LinkDevices.tsx` (step `pasteLink`) · mobile `LinkDevices/LinkDevices.component.tsx` + `PasteInviteLink` variant `pasteDeviceLink`. Stories: Screens/Onboarding → Link devices, Paste link on Link devices, Paste link · not a device link.

### Join with invite link  ·  `open-invite-link`
Figma frame `Open invite link` · Section: Onboarding · 375×667 · node `2811:2455` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2455)

Copy:
- Join with invite link
- Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)
- Paste a link

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Invite link (1), Monster (1)
Goes to: Button → container [added]; Glyph → back [back]
Implemented by: desktop `Onboarding/OpenInviteLinkComponent.tsx` · mobile `OpenInviteLink/OpenInviteLink.component.tsx` — an invite link opened while this screen shows takes the deep-link path (desktop `sagas/invitation/customProtocol.saga.ts`, mobile `store/init/deepLink/deepLink.saga.ts`) straight to Choose username; *Paste a link* is the fallback

### Join with QR code (sheet)  ·  `sheet-2811-2460`
Figma frame `Sheet` · Section: Onboarding · 375×499 · node `2811:2460` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2460)

Copy:
- Join with QR code

Uses: Join--scan code--QR (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), QR camera mockup (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Account recovery  ·  `recover-account-info`
Figma frame `recover-account-info` · Section: Onboarding · 375×667 · node `2811:2535` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2535)

Copy:
- Account recovery
- Recover account
- Locked out? You can recover with a linked device or ask an admin to send you an invite link.
- Use linked device
- Subtitle
- Use invite link
- More options *(row omitted in both apps — no prototype target)*
- Scan QR code

Uses: ButtonIcons (8), Divider (5), Button row (4), caret-black-r (4), Title bar/Logged in (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1)
Goes to: Content → link-devices [prototype]; Button row → open-invite-link [prototype]; Glyph → back [back]
Implemented by: desktop `Onboarding/RecoverAccountComponent.tsx` (a step of the Join community modal, title bar *Account recovery*; *Use linked device* opens Link devices with a way back to this step, on both platforms) · mobile `RecoverAccount/RecoverAccount.component.tsx` — the info screen and its two prototype routes only; *More options* is drawn in the frame (2811:2535) but has no target anywhere in the prototype, so **both platforms omit the row** until the design gives it one (user, 2026-09-22); the fourth row (*Scan QR code*) is hidden in the frame; the illustration is the frame's own `Icon=Vpn key` glyph at 64px; no recovery mechanism exists

### Link devices — QR code (sheet)  ·  `sheet-2811-2601`

**User decision (2026-09-13): people display the QR code; the raw link is never shown.** Both platforms render this sheet's content (desktop inside the Link devices modal and in Settings → Linked devices, per the Device-linking desktop frame `880:17427`; mobile as a full screen — the sheet itself is a cross-cutting parity item): title bar *QR code* with close (desktop: the close glyph only, no bar title — user decision, #3690), the QR in the library's `qr-code-box` (220, 1px `#B3B3B3` r4, 188 code), the sentence below verbatim, then **Copy link** — a primary button in exactly the slot the Add members QR sheet (`2932:3707`) gives *Share code* (50 tall, r16, padding 20, hug width, centred) — and *Reset QR code* as the text link (16/26 `#2373EA`), which mints a new link; desktop does not draw Reset QR code (user decision, #3690). Copy link puts the link on the clipboard and confirms briefly (*Link copied*: desktop MUI Snackbar, mobile the app's confirmation box); the masked link field with the eye icon and *Copy to clipboard* are gone. Undesigned states, kept with #3400's copy: while the backend mints, the actions give way to the library's progress bar with *Generating device link…* as its status line (`ActionProgress`, #3518's rule — never a greyed-out button; the mobile port lives in `components/ActionProgress`); *Device link unavailable* in the box without a community (desktop Settings only), with no action drawn. Implemented by: desktop `Onboarding/DisplayQrCodeComponent.tsx` (+ `DisplayQrCode.tsx`, reused by `Settings/Tabs/LinkedDevices`) · mobile `LinkedDeviceQRCode/LinkedDeviceQRCode.component.tsx` + `screens/LinkedDeviceQRCode`. Stories: Screens/Onboarding → Display QR code (with 2811:2601, 2932:3707 and 880:17427 alongside), · generating, · no community, Settings · Linked devices. The mobile *Linking devices* progress sheet (`879:15508`) is not part of this change.

**Fit to the window (desktop, #3690).** The sheet ran off the bottom of a short window with nothing to scroll. The box now takes the height the copy and Copy link leave it (`fitQrBox`): 220 wherever the sheet fits as designed (a window 538 tall or more), smaller below that, with the sheet's gaps closed to 8 and most of the bottom padding given back; the copy is what must stay on screen, so the code gives way first. A shrunk code is drawn at 2.5 device pixels a module or more, or snapped to whole device pixels a module (never under 2) with crisp edges — at fractional sizes under that a 69-module device link stops reading off a 1x screen. Measured in Chromium at 1x/1.25x/1.5x/2x from 400 to 560 tall: every size decodes and the copy is always on screen; the whole sheet fits from ~440 up at 1x and from 400 at 1.5x and 2x. Every full-window `ui/Modal` body now scrolls, so whatever is still taller than the window (a long linked-devices list, the 400 window at 1x, the camera steps) is reachable. `DisplayQrCode.fit.cy.tsx` checks the sheet and the scroll in a real browser.
Figma frame `Sheet` · Section: Onboarding · 375×442 · node `2811:2601` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2601)

Copy:
- QR code
- Scan this from “Link devices” on another device to link the devices.
- Reset QR code

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Link devices--display code--QR (1), qr-code-box (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Link devices — Scan QR code (sheet)  ·  `sheet-2811-2587`
Figma frame `Sheet` · Section: Onboarding · 375×571 · node `2811:2587` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2587)

Copy:
- Scan QR code
- Go to “Link devices” on the other device and display the QR code. Scan it to link devices.

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Link devices--scan code--QR (1), QR camera mockup (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Paste a link to Join (WIP)  ·  `container`
Figma frame `Container` · Section: Onboarding · 375×667 · node `3190:10892` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3190-10892)
> Designer's work in progress: this frame is create--default duplicated with only the heading changed to 'Paste a link to Join' and the input placeholder to 'Link'. Title bar, subtitle and the avatar upload are unchanged.

App copy uses sentence case, *Paste a link to join* (user, 2026-09-22); the frame's casing is the designer's WIP.

Copy:
- Create a community
- Paste a link to Join
- Name your community and add a custom icon.
- UPLOAD
- Add a name for your community
- Link
- Caption
- Continue

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Edit profile avatar (1), Camera (1)
Goes to: Glyph → back [back]
Implemented by: desktop `Onboarding/PasteLinkComponent.tsx` · mobile `JoinCommunity.component.tsx` (variant `inviteLink`)

Error copy under the input (undrawn state; the strings are the app's, unchanged):
- *Please check your invite link and try again* — the client could not read the link at all (`InviteLinkErrors.InvalidCode` / mobile `INVALID_INVITATION_ERROR`); a scanned code that is not an invitation says the same, and so does a request the backend refused outright (`JoinCommunityError` kind `refused`), which tells us nothing about why and so says nothing more.
- *This invite is invalid or has expired. Please try again.* — `ErrorMessages.INVALID_INVITE`.
- *Joining was interrupted when Quiet went to sleep. Please try again.* — `ErrorMessages.ADMISSION_INTERRUPTED_RETRY`.
- *Joining timed out. Please try again when other peers are online.* — `ErrorMessages.COMMUNITY_ADMISSION_TIMEOUT`.
- *Joining timed out. Please try again and make sure both devices have the app open.* — `ErrorMessages.DEVICE_ADMISSION_TIMEOUT`.
- *This is not a device link. Use the link from Link devices on your other device.* — only on the Link devices variants (`InviteLinkErrors.NotDeviceLink`; undesigned, see the 2026-09-13 decision).

All six are drawn in the same slot and none of them moves the user off this screen (user decision, 2026-09-22). That includes the case that used to have no message at all: a join the backend
refuses outright now reports itself as a `refused` failure, so it comes back here like the rest
instead of dropping the user at the three-way choice. A failed *community creation* reaches the
same progress screen with no invite field to return to, so it keeps the three-way choice.

**One rule, not one per screen (user, 2026-09-22).** What counts as an invite link, and what to
say when it is not one, was the pre-redesign *Join community* form's job (desktop
`PerformCommunityActionComponent`, the `CommunityOwnership.User` branch; mobile the old
`JoinCommunity.component`). Those screens are gone and the redesign had copied their rule into
each new surface. It now lives in one place per platform — desktop `forms/inviteLink.ts`,
mobile `utils/inviteLink.ts` — with the error copy alongside it (desktop keeps the strings in
`forms/fieldsErrors.ts`). The paste step, the QR scanner and both Link devices variants all call
it, so the scanner's message and the field's message cannot drift apart.

### Crop photo  ·  `crop-photo-3`
Figma frame `crop photo 3` · Section: Onboarding · 375×667 · node `2811:2394` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2394)

Copy:
- Done
- Crop  photo
- Create channel
- Every new message
- Add members
- Settings

Uses: ButtonIcons (6), Divider (4), Button row (3), check-black (3), caret-black-r (3), Title bar/Logged in (1), RightZ (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: RightZ → join-photo-name-true-2811-2366 [prototype]; Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Choose username  ·  `username-default`
Figma frame `username--default` · Section: Onboarding · 375×679 · node `2811:2371` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2371)

Copy:
- Create a community
- Choose username
- Enter a username
- Username
- Your username will be public, but you can choose any name you like. No spaces or special characters. Lowercase letters and numbers only.
- Continue

Uses: Username (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Input3.0 (1)
Goes to: Search input → username-populated [prototype]; Glyph → back [back]
Implemented by: desktop `CreateUsername/CreateUsernameComponent.tsx` · mobile `Registration/UsernameRegistration.component.tsx`

### Choose username — name typed  ·  `username-populated`
Figma frame `username-populated` · Section: Onboarding · 375×679 · node `2811:2373` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2373)

Copy:
- Create a community
- Choose username
- Enter a username
- Denise
- Your username will be public, but you can choose any name you like. No spaces or special characters. Lowercase letters and numbers only.
- Continue

Uses: Username (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Input3.0 (1)
Goes to: Glyph → join-photo-name-true-2811-2366 [prototype]; Button → community-home [prototype]
Implemented by: desktop `CreateUsername/CreateUsernameComponent.tsx` · mobile `Registration/UsernameRegistration.component.tsx`

### Create a community — filled  ·  `join-photo-name-true-2811-2366`
Figma frame `join-photo+name-true` · Section: Onboarding · 375×667 · node `2811:2366` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2366)

Copy:
- Create a community
- Name your community and add a custom icon.
- Add a name for your community
- nyc-activism
- Caption
- Continue

Uses: Create community (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Edit profile avatar (1)
Goes to: LeftZ → get-started [prototype]; Button → username-default [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Community home  ·  `community-home`
Section: Onboarding · 375×700 · node `2811:2370` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2370)
> A canvas-level instance rather than a frame — what username-populated's Continue goes to. The prototype goes straight to the community after username; the implementation inserts ToS / captcha here when a server is involved.

Copy:
- nyc-activism
- 99+
- Add members
- Channels
- General
- bug-reporting
- philosophy
- wins-and-data
- channel-3

Uses: List item (10), badge2 (10), st-#-public (8), Avatar type (2), Community home (1), Title bar / Community (1), Community icon top-level (1), Scheduled send (1), search (1), Online indicator (1)
Goes to: Avatar and switcher → community-switcher-2853-1955 [prototype]; Frame 1452 → want-a-server [prototype]
Implemented by: desktop `Channel/ChannelComponent.tsx` · mobile `Chat/Chat.component.tsx`

### Community switcher  ·  `community-switcher-2853-1955`
Section: Onboarding · 320×700 · node `2853:1955` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2853-1955)

Copy:
- Communities
- Nyc activism
- ⌘1
- TalkTerrace
- VibeVillage
- Label
- 99+
- Join a community
- Create a community
- Linked devices

Uses: Person add (26), gear (26), Spinner (18), Community nav row (13), Community icon states (13), Avatar type (13), badge2 (13), Actions (13), Alpha (9), Icons (3)
Goes to: Person add → want-a-server [prototype]; Glyph → back [back]; Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Want a server?  ·  `want-a-server`
Section: Onboarding · 375×602 · node `2922:10009` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2922-10009)
> In the prototype this is reached after username → Community home → Community switcher, i.e. once the community exists. Both apps show the equivalent offer during community creation (ServerOffer) instead.

Copy:
- Add members
- Want a server?
- It's free!
- Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.
- Use Quiet’s server
- Not now
- Please fill out your shipping information if you want to include it
- Don’t show this again

Uses: Divider (2), Button (2), Want a server (1), Title bar/Logged in (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: Button → choose-a-plan [prototype]; Button → no-server [prototype]; Glyph → back [back]
Implemented by: desktop `ServerOffer/ServerOfferComponent.tsx` (the 375 column in the Modal full-window shell) · mobile `ServerOffer/ServerOffer.component.tsx` (a screen; the bottom drawer and the duplicate `CreatingOffer` copy are gone, as Agree & join's drawer went in #3524). Built to the frame on `design/want-a-server`; the apps keep showing it during community creation. The bar glyph is the frame's own link (*Glyph → back*): it returns to the create step with the typed name still in the form and creates nothing, while *Not now* is the decline that creates the community without a server.

### Choose a plan  ·  `choose-a-plan`
Section: Onboarding · 375×697 · node `2924:13381` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2924-13381)

Copy:
- Free
- The minimum for notifications on iPhone and chill battery use on Android.
- Full iPhone support and fast joining for new members
- No video calls
- 20 MB per-file limit on iOS, unlimited on other platforms
- Choose
- Pro
- $6.25 USD per person/month
- Big, fast file uploads and cozy video calls.
- Faster uploads & downloads
- 5-person video calls
- 200 MB per-file limit on iOS, unlimited on other platforms

Uses: check-black (8), Plan (3), Button (3), arrow-up (3), Plans (local component) (1), Plan-free (1), close (1), Plan-tier2 (1), Plan-tier3 (1), Title bar/Logged in (1)
Goes to: Button → agree-and-join-server-opt-in-3054-4090 [prototype]; Button → agree-and-join-server-opt-in-3054-4090 [prototype]; Button → agree-and-join-server-opt-in-3054-4090 [prototype]; Glyph → community-home [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### No server?  ·  `no-server`
Section: Onboarding · 375×458 · node `2922:10050` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2922-10050)

Copy:
- Title
- No server?
- This won’t work well for iPhone users in your community.
- Go back
- Continue without server

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), No server? (1), Exceeding community duration (1)
Goes to: Glyph → want-a-server [prototype]; Button → want-a-server [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Agree & join — server opt-in  ·  `agree-and-join-server-opt-in-3054-4090`
Figma frame `Agree-and-join (server opt-in)` · Section: Onboarding · 375×700 · node `3054:4090` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3054-4090)

Copy:
- Agree & join
- This community uses a server (api.tryquiet.org) for messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (2), Divider (2), RightZ (2), Placeholder (2), Avatar (2), TitleZ (2), LeftZ (2), Back (2), Button (2), arrow-up (2)
Goes to: Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]; Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `TermsOfService/TermsOfService.component.tsx`

### CAPTCHA  ·  `captcha-3054-4052`
Figma frame `Captcha` · Section: Onboarding · 375×700 · node `3054:4052` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3054-4052)
> Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent — the captcha closes, the new community shows, then the captcha returns; less likely if you wait before clicking) and #3368 (offline: no loading or timeout message, and a 'joining' screen while creating).

Copy:
- CAPTCHA
- VERIFY
- Select all images with a bicycle.

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1)
Goes to: Glyph → agree-and-join-server-opt-in-3054-4090 [prototype]; Frame → home-add-members [prototype]
Implemented by: desktop `renderer/captcha.html + main/preload.captcha.ts` · mobile `Captcha/CaptchaModal.component.tsx`

### Community home — add members  ·  `home-add-members`
Figma frame `Home add members` · Section: Onboarding · 375×700 · node `2932:3681` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3681)

Copy:
- nyc-activism
- 99+
- Add members
- Channels
- General
- bug-reporting
- philosophy
- wins-and-data
- channel-3

Uses: List item (10), badge2 (10), st-#-public (8), Avatar type (2), Community home (1), Title bar / Community (1), Community icon top-level (1), Scheduled send (1), search (1), Online indicator (1)
Goes to: Home add members → add-members-options [prototype]; Avatar and switcher → community-switcher-2853-1955 [prototype]; List item → add-members-options [prototype]
Implemented by: desktop `Channel/ChannelComponent.tsx` · mobile `Chat/Chat.component.tsx`

### Add members  ·  `add-members-options`
Figma frame `Add members options` · Section: Onboarding · 375×404 · node `2932:3709` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3709)

Copy:
- Add members
- Anyone with Quiet app can follow this link to join this community. Only share with people you trust.
https://chat.quiet.org/asdk8UslkfjaXYslslsl
- Copy link
- Every new message
- QR code
- Share
- Reset link

Uses: ButtonIcons (8), Divider (5), Button row (4), check-black (4), caret-black-r (4), Title bar/Logged in (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1)
Goes to: Button row → add-members-qr-code [prototype]; Glyph → back [back]
Implemented by: desktop `Settings/Tabs/Invite/Invite.component.tsx` · mobile `QRCode/QRCode.component.tsx`

### Add members — QR code  ·  `add-members-qr-code`
Figma frame `Add members--QR code` · Section: Onboarding · 375×552 · node `2932:3707` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3707)

Copy:
- QR code
- This community QR code is private. If it is shared with someone, they can scan it with their camera to join this community.
- Share code
- Reset QR code

Uses: Add members--QR code (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), qr-code-box (1)
Goes to: Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Use Quiet’s server? (v1)  ·  `agree-and-join-v-1-before-we-support-multiple-hosts`
Figma frame `Agree-and-join (v1 before we support multiple hosts)` · Section: Server agree (joiner, v1) · 375×700 · node `3111:4339` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3111-4339)
> 'v1 before we support multiple hosts' — joiner-side agree screen. Not linked from Open invite link or username in the prototype. The implementation shows JoiningOptIn + TermsOfService after username.

Copy:
- Use Quiet’s server?
- This community will use Quiet’s server for end-to-end encrypted messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Button (1), arrow-up (1)
Goes to: Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `ServerOffer/JoiningOptIn/JoiningOptIn.component.tsx`


### Join from invite link — second prototype (added 2026-09-13)

File **Join from invite link + prototype** (`dSEZJr9crJjcV3ILogea9C`), page *Draft 1* (`7:2510`), section *Prototype: Join + Recover* (`2873:5377`). It draws the join path **after** the invite link is pasted — which the Get started prototype stops short of. Scope, per the user: the username screens, the Agree & join screen and the joining-progress screen; account recovery is out. The file's other four sections are screenshots of WhatsApp, a browser and two phones, not Quiet screens.

Five stages, wired by the file's own prototype links: *Choose a username (join)* → *— name typed* → *Agree & join (joiner)* → *Joining now!*, with *Starting Quiet* standing alone. One **added** link joins the cluster to the rest of the flow — the paste screen's Continue button (`3190:10901`, in the Get started file) → `2811:2741` — because neither file wires the paste step to anything.

Not included (`flow/extract.py`, per-file `exclude`; also listed under the section in *— all stages —*):

| node | frame | why |
|---|---|---|
| `2811:2732` | recovery-unpopulated | account recovery — out of scope (user, 2026-09-13) |
| `2811:2688` | recovery-populated 1 | account recovery, key pasted |
| `2811:2704` | recovery-populated-2 | account recovery, second state |
| `2811:2660` | recovery-populated-3 | account recovery, third state |
| `2811:2757` | Join community | the Get started file's own `join-community` (`2811:2562`) is already a stage |
| `2811:2769` | Community home | already a stage from the Get started file (`2811:2370`) |
| `2811:2781` | Invite link page | the web invite-link landing page, in a browser |
| `2811:2821` | Frame 1703 | a screenshot of the invite link in a browser |

Two prototype links point into excluded screens and are dropped, not re-pointed: *Joining now!* → Community home (`2811:2769`) and *Starting Quiet* → Join community (`2811:2757`).

### Choose a username (join)  ·  `username-unpopulated`
Figma frame `Username-unpopulated` · Section: Join from invite link · 375×679 · node `2811:2741` · [Figma](https://www.figma.com/design/dSEZJr9crJjcV3ILogea9C?node-id=2811-2741)

Copy:
- Choose a username
- Enter username
- Username
- Your username is only visible in this community. No spaces or special characters.
- Continue

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Input3.0 (1), Input title (1)
Goes to: Search input → username-populated-2811-2749 [prototype]; Glyph → back [back]
Implemented by: desktop `CreateUsername/CreateUsernameComponent.tsx` · mobile `Registration/UsernameRegistration.component.tsx`

Notes, against the create-side *Choose username* (`2811:2371`):
- The bar title **is** shown here, with its divider (`I2811:2744;3606:13264;3606:13770`) — the bar-title decision already carves the username screen out of the hide-the-title rule, and this frame is why.
- Different helper copy: "Your username is only visible in this community." against the create-side "Your username will be public…". Both apps ship the create-side string.
- The label above the input reads *Enter username*, not *Enter a username*, and it is **visible** here (hidden on the create side).
- The input carries a visibility (eye-slash) icon at its right (`I2811:2746;5077:43540`). Nothing in the flow acts on it and a username is not a secret; treat it as a leftover of the Input3.0 instance unless the designer says otherwise.
- Continue is drawn disabled (30%) until a name is typed, matching the create side.

### Choose a username (join) — name typed  ·  `username-populated-2811-2749`
Figma frame `Username-populated` · Section: Join from invite link · 375×679 · node `2811:2749` · [Figma](https://www.figma.com/design/dSEZJr9crJjcV3ILogea9C?node-id=2811-2749)

Copy:
- Choose a username
- Enter username
- Julie
- Your username is only visible in this community. No spaces or special characters.
- Continue

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Input3.0 (1), Input title (1)
Goes to: Frame 1611 → agree-and-join [prototype]; Glyph → back [back]
Implemented by: desktop `CreateUsername/CreateUsernameComponent.tsx` · mobile `Registration/UsernameRegistration.component.tsx`

The input is drawn focussed (blue 1px border) and Continue is at full strength. Its Continue is wired to Agree & join, so in this prototype the joiner consents **after** choosing a username — which is where mobile already shows JoiningOptIn + TermsOfService.

### Agree & join (joiner)  ·  `agree-and-join`
Figma frame `agree-and-join` · Section: Join from invite link · 375×667 · node `2811:2724` · [Figma](https://www.figma.com/design/dSEZJr9crJjcV3ILogea9C?node-id=2811-2724)

Copy:
- Agree & join
- This community uses a server (api.tryquiet.org) for messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Button (1), arrow-up (1)
Goes to: Frame 1612 → globe-animation [prototype]; Glyph → back [back]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `ServerOffer/JoiningOptIn/JoiningOptIn.component.tsx`

The third and newest of three agree screens in the designs, and the only one wired into a join path:
- this one — titled bar *Agree & join*, one paragraph naming the host (`api.tryquiet.org`), one button;
- *Agree & join — server opt-in* (`3054:4090`) — creator-side, reached from Choose a plan;
- *Use Quiet's server? (v1)* (`3111:4339`) — "v1 before we support multiple hosts", unwired.

The host is written into the copy as a literal domain. The implementation has no such string; if this copy ships, the domain has to come from the invite, not from a constant. "Privacy Policy and Terms of Use" is drawn underlined as one link (`2811:2729`) — one target for two documents, which the designer has not resolved.

### Joining now!  ·  `globe-animation`
Figma frame `Globe animation` · Section: Join from invite link · 375×667 · node `2894:3382` · [Figma](https://www.figma.com/design/dSEZJr9crJjcV3ILogea9C?node-id=2894-3382)

Copy:
- N
- nyc-activism
- Joining now!

Uses: Globe animation (2), Avatar type (2), Spinner (2), Community icon top-level (1), Alpha (1), Scheduled send (1), search (1), Online indicator (1), Globe animation scale (1), Progress bar 2 (1)
Goes to: — (its own link continues to Community home `2811:2769`, excluded)
Implemented by: desktop `LoadingPanel/JoiningPanelComponent.tsx` · mobile `ConnectionProcess/ConnectionProcess.component.tsx`

**The QSS progress screen of record** — see *Progress while joining / creating* below. It is an in-app screen, not a modal: the community header (`I2894:3382;5978:19130`, 64 tall, purple, community name + search + avatar) is already drawn, with the globe, the heading and the bar over the empty channel. Desktop is the designer's own Draft-6 frame (`1430:48030`), not this content in the modal shell.

### Starting Quiet  ·  `starting-quiet`
Figma frame `Starting Quiet` · Section: Join from invite link · 375×667 · node `2811:2770` · [Figma](https://www.figma.com/design/dSEZJr9crJjcV3ILogea9C?node-id=2811-2770)

Copy:
- Quiet
- Starting Quiet
- Connecting to Tor...

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Quiet logo (1), Progress bar 2 (1)
Goes to: — (its own link returns to Join community `2811:2757`, excluded)
Implemented by: desktop `LoadingPanel/StartingPanelComponent.tsx` · mobile `Splash/Splash.component.tsx`

App start, not the join step, and kept for one reason: it is the drawn evidence for the **status line under the bar** — bar, *Starting Quiet* (`I2811:2777;5390:19572`), *Connecting to Tor...* (`I2811:2778;832:7718`, 12/16 #7F7F7F). The Tor wording is exactly what the QSS variant drops. Two things to settle:
- neither app draws this today: desktop's `StartingPanelComponent.tsx` renders only the Quiet logo (its `progressBar` / `progress` styles are declared and never used) and mobile's `Splash.component.tsx` shows the logo with "Starting backend" / "This can take some time";
- the bar reads **Quiet** (`I2811:2773;3606:13264;3606:13770`), the same header the Get started decision removed as redundant with the window. Worth confirming whether it goes here too.

### Progress while joining / creating (decided 2026-09-13)

**Rule (user):** joining over **Tor** keeps the existing explanatory screen; joining or creating with **QSS** gets a simpler progress bar. The designs exist and are exported to `figma/progress/`:

| use | design | node | what it shows |
|---|---|---|---|
| Tor join (mobile) | Quiet Design Library › Content/pages › *Joining now* | `5978:19161` | globe illustration, **Joining now!**, progress bar, the explanation ("You can exit the app - we'll notify you once you're connected! **This first time might take 30 seconds, 10 minutes, or even longer.** There's a good reason why it's slow: Quiet stores data on *your* community's devices (not Big Tech's servers!) and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can take a long time to connect at first."), link **Learn more about Tor and Quiet** |
| Tor join, status line | Mobile + desktop + prototypes › Prototype › *Joining* | `1316:34596` | the same inside the community chrome, with a status line under the bar: **Connecting via Tor** |
| QSS join / create (mobile) | Quiet Design Library › Content/pages › *Joining now* | `5978:19142` | globe, **Joining now!**, progress bar — nothing else |
| QSS join inside a community | Join from invite link + prototype › *Globe animation* | `2894:3382` | **the variant of record** — the simple variant under the community header; a stage in the flow since 2026-09-13 (`onboarding-flow--globe-animation`) |
| Desktop (QSS) | Mobile + desktop + prototypes › Draft 6 › Frame 1320 | `1430:48030` | the split view with the sidebar greyed; centered in the chat area a progress bar, **Creating community "Rockets"**, and an optional secondary line ("Additional info if needed can go here otherwise this is hidden") — export `figma/desktop/desktop-creating-community.png` |
| Components | Library › Info, alerts, banners › *Progress bar 2* `5390:19569`, *Progress-loading-template* `6049:26981` | — | the bar itself: track 300×4 #F0F0F0 r100; fill **teal #67BFD3** (user decision 2026-09-13). *Progress bar 2* also carries the two text slots under the bar: *Status* `5390:19572` and *Additional info* `5390:19573` |

**The QSS screen of record and its status line (user, 2026-09-13).** `2894:3382` is what joining with QSS looks like: the community header already drawn, the globe (`I2894:3382;6110:27667`), **Joining now!** (`I2894:3382;5978:19146`) and the 300×4 bar (`I2894:3382;5978:19147`) over the empty channel. No Tor paragraph, no *Learn more* link. The frame itself draws **no status line** under the bar — keep the one both apps already render, by decision: desktop `LoadingPanel/JoiningPanelComponent.tsx` prints `connectionInfo.text` immediately under the bar, mobile `ConnectionProcess/ConnectionProcess.component.tsx` prints `connectionProcess.text` (`testID='connection-process-text'`, 14/20, 8 under the bar); the strings are the `ConnectionProcessInfo` enum in `packages/types/src/connection.ts`. The design backs that up in three places: the library component's own *Status* / *Additional info* slots (`5390:19572` / `5390:19573`), the desktop Draft-6 frame filling them ("Creating community “Rockets”" `I1430:48025;3816:12490` and "Additional info if needed can go here otherwise this is hidden." `I1430:48025;3816:12495`), and the same prototype's *Starting Quiet* frame (`2811:2770`) drawing bar + status + message for app start.

**Correction to the teal decision (2026-09-13).** The decision stands — the fill is teal #67BFD3 — but the reason recorded earlier ("as the prototypes draw it") is wrong: no mobile Figma frame draws teal. The library *Joining now* frames (`5978:19142`, `5978:19161`) and both progress frames in the join prototype (`2894:3382`, `2811:2770`) all draw the *Progress bar 2* default **blue #1B6FEC**. Teal appears in the desktop Draft-6 frame, which uses the older *Progress bar/75%/True* component (`I1430:48025;3816:12501;3816:12486`), and in the shipped mobile app, which animates #67BFD3 while `CONNECTING_TO_COMMUNITY`. Adopting teal means changing every mobile frame, not matching them.

Implementation mapping: desktop `LoadingPanel/JoiningPanelComponent.tsx` and mobile `ConnectionProcess/ConnectionProcess.component.tsx` are the joining screens and branch on whether the community uses a server: Tor → the explanatory *Joining now* (+ "Connecting via Tor" status); QSS → the simple bar, and on desktop the Draft-6 layout ("Joining community "X"" / "Creating community "X""). App start is a different pair — desktop `LoadingPanel/StartingPanelComponent.tsx` (logo only today) and mobile `Splash/Splash.component.tsx` — and is what `2811:2770` draws. Not designed: an error / timeout state (open bug #3368) — keep the app's existing message. Older draft `1031:42695` ("Joining… can take 10 minutes or more!" with a research prompt) is superseded by the library frames.

### Mobile parity audit (2026-09-13)

Audit of the Android app on `design/onboarding-entry` @ f12463cd2 against the prototype (agent `mobile-parity`; phase 2 — the fixes — not started when the session ended). Root cause of "Link devices looks old": the entry screen exists, but *Display QR code* opens #3400's old full-screen "Link a device" (old copy, "Share code", bare QR) instead of the designed *QR code* sheet, and *Scan QR code* opens the paste form.

| stage | node | mobile file | status | what differs |
|---|---|---|---|---|
| Get started | 2811:2550 | components/GetStarted | partial | rows not in the bordered group (1px #E5E5E5 r16; rows 48, pad 16/11, gap 16, #F0F0F0 dividers); row title 16/26; beta caption centred, not left-aligned (its ink is now the frames' #222222 - `gray90`, matching desktop's #3666); content top-anchored (24 under the bar) |
| Join community | 2811:2562 | components/JoinCommunityOptions | partial | missing the heart-chat illustration (I2815:2504;6181:27547, 219×160); bar title hidden in the frame (glyph only); rows not bordered; 24 side margin |
| Open invite link | 2811:2455 | components/OpenInviteLink | partial | bar title hidden in frame; top-anchored; link 16/16 #1B6FEC |
| Paste a link to Join | 3190:10892 | components/JoinCommunity (inviteLink) | partial | close glyph (mobile back); bar title hidden; Input3.0 42 tall r8 1px #999999 placeholder 14/20 #767676; Continue 108×50 r16 centred, 30% until valid; a failed join is reported under this input and never navigates away (2026-09-22) |
| Create a community | 2811:2451 / 2811:2366 | components/CreateCommunity | partial | input label hidden in frame; input/button shapes + disabled-until-valid; bar title hidden; top-anchored |
| Choose username | 2811:2371 / 2811:2373 | components/Registration/UsernameRegistration | partial | back glyph + divider visible; label hidden; caption 12/16 #7F7F7F; input/button shapes |
| Link devices | 2811:2575 | components/LinkDevices + screens/LinkDevices | partial | bar title hidden; the Linked devices list ships on the share direction (#3636) with the overline header, bordered card and "No linked devices" in #767676, but without the frames' per-row *Active* subtitle (the backend reports no such status); the trash glyph is still absent (no device removal) |
| Link devices — QR code (sheet) | 2811:2601 | screens/LinkedDeviceQRCode → components/QRCode | **old design** | full screen not a sheet; title "Link a device"; #3400 copy; "Share code" button (design: "Reset QR code" text link); QR 172 bare (design: qr-code-box 220, 1px #B3B3B3 r4, 188 QR); no "Generating device link…" state |
| Link devices — Scan QR code (sheet) | 2811:2587 | screens/PasteInviteLink (deviceLink) | **old / camera missing** | paste form instead of the sheet with viewfinder; no camera dependency on any branch |
| Join with QR code (sheet) | 2811:2460 | screens/PasteInviteLink (qrCode) | **old / camera missing** | same; duplicated heading |
| Account recovery | 2811:2535 | components/RecoverAccount | partial | bar title hidden; rows not bordered; the frame's "More options" row is omitted (no prototype target — user, 2026-09-22) |
| Want a server? | 2922:10009 | components/ServerOffer | **done** (`design/want-a-server`) | rebuilt to the frame on both platforms: the bar zone with the close glyph and no title, heading h3 500, the "It's free!" pill (#F9EFFF inside #ECDCF5, r4, 14/20 #461863), body 14/20 #222222, "Use Quiet's server" (50 tall, r16) over the "Not now" link (16/16 #7F7F7F), the full-bleed rule and the 16 checkbox, 24 between every block. Mobile is a screen, not the 2/3 drawer, and the bar glyph goes back to the create step (the frame's own *Glyph → back*) rather than answering the offer. What still differs is only *when* it is shown — during creation, not from Home → Add members |
| No server? | 2922:10050 | — | **missing** | "No server?" / "This won't work well for iPhone users in your community." / [Go back] / "Continue without server" (unwired in the file — interpretation: proceed without server) |
| Community home / switcher | 2811:2370 / 2853:1955 | ChannelList, CommunityContextMenu | old design | in-app, not onboarding; multi-community not in the app — out of scope |
| Agree & join, CAPTCHA, Add members (+QR), progress | — | — | in flight | design/onboarding-impl (both platforms) |

Cross-cutting: bordered row group absent (also on desktop's RowGroup); content vertically centred vs top-anchored; full-screen frames hide the bar title (only sheets show one); Appbar 52 with a permanent divider vs 60 without; Input3.0 and Button (r16, 50, disabled 30%) shapes. Decisions taken: real camera scanning on mobile (vision-camera), No server? built, shared components for the cross-cutting items.

### Device linking — desktop designs (user pointer, 2026-09-13)

`Device linking` file `3RcrYKRTiFY87TpFSqZyj4`, canvas *Draft 5* (`880:17585`, Dec 2024). Exports in `figma/desktop/devicelink/`:
- Desktop (board `879:18182` "Link devices (some desktop examples)"): `879:20987` Link devices in the Modal full-window shell, no linked devices; `880:17196` with linked devices; `880:17427` Display QR code (the QR inside the shell). Rows in this draft carry subtitles ("Scan this code with another device" / "Use this device to scan a code from another device"); the 2026 prototype (`2811:2575`) drops them — prototype copy wins, these frames give the desktop structure. Also in *Desktop designs*.
- Mobile (board `879:16665`): Link devices basic states `879:15415` etc.; QR sheet `879:15503` (Link devices—QR instance); **Linking devices** progress sheet `879:15508` (Progress-loading-template-mobile `910:33355`); Linked / Without linked / With linked / Removed states `879:15640` / `879:15644` / `879:15648`; QR-scan-code sheets `879:15946` / `879:16178`. Entry points boards `879:14680` (mobile) / `879:19861` (desktop): Get started row and the Communities switcher's "Linked devices" row.
- Banner promos (`898:8033` mobile, `898:8104` desktop): out of scope.
- User decisions (2026-09-13): a third row **Paste link** on Link devices (Button row + link glyph; device links only, inline error otherwise); on the QR sheet a primary **Copy link** button in the Add-members "Share code" slot, no raw link shown; desktop Link devices / Linked devices match mobile and these frames.

### Purged stages (user decision, 2026-09-12)

Removed from the click-through and the exports: Apple system UI captured as stages, frames that are pixel-identical and differ only in prototype wiring, extra input states of one screen, and placeholder art. Both Agree & join screens stay — opt-in consent is a step in the process. Links from kept screens into a purged one were re-targeted to the kept equivalent or dropped (`flow/gen.cjs` `PURGE`).

| slug | Figma frame | why | links into it now go to |
|---|---|---|---|
| `ios-photo-gallery-2811-2501` | iOS photo gallery (`2811:2501`) | iOS system UI (photo picker), not a Quiet screen | `crop-photo-3` |
| `create-populated-focussed` | create--populated-focussed (`2811:2453`) | extra input state of Create a community; a library needs default + filled | `join-photo-name-true-2811-2366` |
| `ios-photo-gallery-2811-2467` | iOS photo gallery (`2811:2467`) | iOS system UI; pixel-identical to the other picker | `crop-photo-3` |
| `join-photo-no-name` | join-photo-no-name (`2811:2368`) | extra input state of Create a community (photo, no name) | `join-photo-name-true-2811-2366` |
| `crop-photo-4` | crop photo 4 (`2811:2432`) | zoomed-out state of Crop photo; kept the default (zoomed-in) frame | `crop-photo-3` |
| `crop-photo-1` | crop photo 1 (`2811:2375`) | pixel-identical to crop photo 3 (other wiring path) | `crop-photo-3` |
| `join-photo-name-true-2811-2364` | join-photo+name-true (`2811:2364`) | pixel-identical to 2811:2366 (other wiring path) | `join-photo-name-true-2811-2366` |
| `crop-photo-2` | crop photo 2 (`2811:2413`) | zoomed-out duplicate (other wiring path) | `crop-photo-3` |
| `agree-and-join-server-opt-in-2924-13388` | Agree-and-join (server opt-in) (`2924:13388`) | pixel-identical duplicate (other wiring path) | `agree-and-join-server-opt-in-3054-4090` |
| `captcha-2924-13413` | Captcha (`2924:13413`) | pixel-identical duplicate; its only extra exit led to the subscription mock | `captcha-3054-4052` |
| `click-to-subscribe` | Click to subscribe (`2930:3493`) | placeholder art (a NITRO subscription mock), not Quiet | dropped |
| `community-switcher-2940-3271` | Community switcher (`2940:3271`) | pixel-identical duplicate (other wiring path) | `community-switcher-2853-1955` |
| `overlay-app-store` | Overlay: App Store (`2930:3444`) | iOS App Store purchase overlay, not a Quiet screen | dropped |
| `ios-views-activity-views-share-dark` | iOS / Views / Activity Views / Share - Dark (`2932:3712`) | iOS share sheet, not a Quiet screen | dropped |

## Desktop designs (found after the first pass)

**The desktop model (decided): base every desktop onboarding screen on the library's `Modal full-window` shell** (node `5825:29938`, 715×929). The content inside is the same 375-wide design mobile uses — the library's `Join community` variants are 375 wide — so desktop and mobile share content and differ only in the shell. The library's `Register username` (600×889) is stale cruft and must not be used for copy; desktop username = the mobile prototype's *Choose username* inside the shell, keeping the app's current validation and the parsed-name warning (`CreateUsernameComponent.tsx`).

Earlier scans looked only at top-level frames; the desktop onboarding designs are depth-2 library components and instances. Story `onboarding-flow--desktop-designs` shows each one. Use these for the desktop variants instead of inventing 600px modals.

| design | size | file (last edit) | node | mobile counterpart | note |
|---|---|---|---|---|---|
| Join community — From=invite link | 375×528 | Quiet Design Library (2025-04-15) | `5977:35186` | `container` | Post-invite-link state of the desktop join flow: Create new account / Recover account, with the beta warning. Shown after an invite link is opened. |
| Join community — From=Get started | 375×505 | Quiet Design Library (2025-04-15) | `5984:26019` | `join-community` | Desktop three-way choice: Join with invite link / Join with QR code / Recover account — the same routes as mobile. |
| Full screen modal | 816×540 | Quiet Design Library (2025-04-15) | `6177:33782` | `container` | Desktop paste screen; the library calls it an 'invite code'. |
| Register username | 600×889 | Quiet Design Library (2025-04-15) | `1236:1837` | `username-default` | Library component for registering a username on desktop. |
| modal/small | 800×636 | Quiet Design Library (2025-04-15) | `6209:16742` | `agree-and-join-server-opt-in-3054-4090` | modal/small at 800 wide — one of a responsive pair. |
| modal/small | 1064×636 | Quiet Design Library (2025-04-15) | `6209:17520` | `agree-and-join-server-opt-in-3054-4090` | modal/small at 1064 wide — the other of the pair. |
| Modal full-window | 715×1018 | Device linking (2024-12-11) | `879:20293` | `get-started` | 'Modal full-window' instance: desktop Let's get started with Join / Create / Link devices. From the Device linking file (Dec 2024). |
| Modal full-window | 715×929 | Subscriptions, plans, upgrade server (2025-01-17) | `2840:6695` | `want-a-server` | 'Modal full-window' with Add members → Want a server? on desktop. |
| Join community | 816×540 | Mobile + desktop + prototypes (2024-12-23) | `1967:54355` | `open-invite-link` | Older (Dec 2024) desktop join: paste your invite link. |
| Create world | 712×556 | Mobile + desktop + prototypes (2024-12-23) | `1430:47383` | `create-default` | Desktop Create a community (name only). |
| Frame 1327 | 816×540 | Mobile + desktop + prototypes (2024-12-23) | `1430:51905` | `open-invite-link` | 'Do you want to join the community Disco-fever?' — the invite-link confirmation; no mobile counterpart in the prototype. |
| Frame 1331 | 816×540 | Mobile + desktop + prototypes (2024-12-23) | `1430:52275` | `username-populated` | Older (Dec 2024) desktop username modal with the same helper copy. |

**Correction (after viewing the exports):** the library's `Join community` 798×700 is the join sub-flow in two states — post-invite (*Create new account / Recover account*) and the three-way choice (*Join with invite link / Join with QR code / Recover account*), i.e. the same three routes as mobile. The only desktop *app entry* found is the Dec-2024 `Modal full-window` (*Let's get started… / Join a community / Create a new community / Link devices*), which matches mobile's Get started. So desktop and mobile agree on routes; desktop's entry design is simply a year older. Phase 1: desktop entry = the Modal full-window layout with the mobile prototype's copy; desktop three-way join = the library component; device linking stays reachable from the entry AND from Settings (#3400).

The desktop shell for onboarding is the library's **Modal full-window** (715 wide) for entry screens and **modal/small** (800 / 1064 wide — a responsive pair) for confirmations such as Agree & join.

**Windows wider than 715 (our interpretation, not designed):** the library draws the shell at one width and its body is the placeholder slot (grey, "Replace with content"), so nothing in Figma says how the modal behaves at 1024 / 1280 / 1440. The prototype's desktop sizes render the shell's *chrome* — 36px top bar with window controls, 60px title bar with the back arrow at the left and the title centered — to the full window width, a white content area below it to the window's full height, and the screen's 375-wide content centered in that area with its own title bar removed (its title text moves to the shell's bar). Hotspots follow the content; the screen's back/close maps to the shell's back arrow. This is what `:6106` (the implementation) renders too, so the two agree; if the designer specifies a max content width or a different stretch rule, change `ScreenAt` in `flow/FigmaFlow.tsx` and the app's shell together.

**In-app and server stages on desktop (decided 2026-09-12: "sidebar on left and chat in the rest of the screen"; "there should be plenty of designs on this in figma already"):** the designer's own desktop frames exist and are used, one per stage (`flow/gen.cjs` `DESKTOP`; all in *Desktop designs*): Community home = *Mobile + desktop + prototypes* Frame 1321 (`1430:48044`, 740×800: 220 sidebar, chat filling the rest, empty channel); Community home — add members = Frame 1323 (`1430:48372`, the community menu with *Add members* — **user decision, 2026-09-22: on desktop Add members lives in that menu, the settings drawer the community name and caret open, and not in the sidebar column**; the newer library Desktop sidebar V1 `6218:16416` does draw an Add members row above Channels and the app briefly had one, which this decision removed); Community switcher = *Community settings/switcher* Frame 1619 (`1104:38645`, the Communities panel over the split view); Choose a plan = *Subscriptions* `2840:6718`, three plan cards as 715-wide content in the Modal full-window shell. The same draft's desktop Want a server? (`2840:6698`) and CAPTCHA (`2840:6724`) are the 375 card at (170, 64) on a transparent 715 canvas — the geometry the shell composition of the mobile frame already produces — so those stages keep it (this also answers the open question: on desktop the server offer sits in the shell, not over the split view). The 740 frames are drawn at 740; in wider windows the left part and the right-anchored part keep their places and the gap is the frame's own plain column stretched, so every pixel is the designer's. Hotspots are measured on the exports and wired to the targets of the mobile frame's own links. Not yet given a desktop frame (still the mobile content in the shell): No server?, Agree & join (the library's modal/small 800 / 1064 cards exist and should become its desktop rendering next), Add members and Add members — QR code, Community home's server entry (the Subscriptions draft reaches it from an *Upgrade Server* button in the sidebar, `2840:6632`).

## E2E requirements for the implementation PR

- Desktop: extend `packages/e2e-tests/src/tests/` following `multipleClients.test.ts` / `multipleClients.qss.test.ts` (two clients, selenium): cover Get started → three-way join → paste link → username; create → username; and **device linking multiplayer**: client A creates a community and generates a device link (`LinkedDevices` tab); client B joins via that link as the *same user’s second device*; both show the community; a message sent from B appears on A; and A’s device list names B while B’s names A. All of those run in `onboarding.test.ts` today — A’s list draws its empty line before B links, and each device lists only the other. Unlinking still waits on the backend (#3400/#3471 for removal).
- Mobile: build on `packages/mobile/e2e` and the Appium work in #3483; the same device-linking scenario with an Android emulator as the second device where the harness allows, otherwise desktop↔mobile.
- Every new story passes `sb-gate.sh` and is agent-verified before the PR is called ready; `tsc --noEmit` on every commit (the Storybook build is babel-only).
