# Onboarding — design spec for implementation

Generated 2026-09-11 from the Figma prototype **Get started (prototype)** (`f6Nr5b5wtvk6Xoh1HJZ8Dd`, last edited 2026-04-14) and the shipping code on branch `design/storybook-grid`. Every string under *Copy* is the designer's text node, verbatim. Nothing here is invented; where the design is silent it says so.

## Framing (decided 2026-09-12)

Storybook **is the new design library**, being rebuilt from this spec: one design — 4px grid, the Rubik scale, mobile-canonical layout, `Modal full-window` on desktop — scoped to features that exist in the code or are in branches now. There are no before/after or 2px comparisons in Storybook; `design-system/tokens` exports a single `tokens` set. Stories are library entries: `Foundations/*`, `Components/*`, `Screens/*`, `Onboarding flow`, `Desktop — designs`.

## Decisions already made

- **Spacing grid: 4px** — steps 4 8 12 16 24 32 48 64; semantic roles xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 (`design-system/tokens/grid-4px.ts`).
- **Type scale (Rubik, weights 400/500 only)**: overline 10/16 w500 · caption 12/16 · body 14/20 · subtitle 14/20 w500 · bodyLg 16/24 · h5 16/24 w500 · title 20/28 w500 · h3 28/36 w500 · h2 32/40 w500 · h1 48/56 w500. Adopting it is component work: 39 desktop files hardcode `fontSize`; `TextMessage.tsx`/`BasicMessage.tsx` use no theme variants.
- **Join community becomes a three-way choice**: *Join with invite link* / *Join with QR code* / *Recover account* — replacing the single paste field both apps ship.
- **Storybook first, then implement.** Stories live under `packages/desktop/src/renderer/design-system/`; new stories set `chromatic: { disableSnapshot: true }`. Reviews get a frozen static build gated by `/mnt/storage/holmes-tmp/sb-publish.sh` + `sb-gate.sh`, then an agent check.
- **No invented screens or copy.** Real components, or the designer's exports/text.
- **Base branch**: stack on the RN 0.81 line (`upgrade/react-native-081` → `upgrade/react-native-new-architecture-node`), not on `develop`. Bring in `feat/2610-device-linking` (#3400) by merge; align to its vocabulary: `DeviceLinkInvite`, `deviceLinkUrl`, `LinkedDevices` (desktop Settings tab), `LinkedDeviceQRCode` (mobile screen), strings “Generating device link…”, “Device link unavailable”.

## Layout canon (decided 2026-09-11)

**The mobile prototype is canonical** for layout, alignment and copy. Desktop = the same 375-wide content column centered inside the `Modal full-window` shell. Measured in the file: 26 of the 30 onboarding screens have a **centered** title (the exceptions are iOS crop-screen "Done" buttons and in-app chrome — channel names, the plan card, the iOS share sheet). Rule for every onboarding screen, both platforms: centered title and subtitle; centered illustration where one exists (exported as SVG, never redrawn); full-width action rows / inputs / primary button below; the beta caption at the bottom of the entry screen. The older Dec-2024 desktop frames and the app's current desktop modals are left-aligned and are **not** followed.

## The flow as the prototype wires it

38 of 39 screens are one connected graph (70 prototype links). Ids are the Storybook story ids under `Onboarding flow`.

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
```

**Where QSS fits, per the design:** creator-side, *after* the community exists (Community home → switcher → Want a server?). Both apps show the offer *during* creation and the joiner ToS *after* username. This is a product decision to make explicitly; phase 1 keeps the shipping timing and records the disagreement.

## Phase 1 scope (implement now)

1. **Get started** entry screen (both apps skip it today): *Let’s get started…* with *Join a community* / *Create a new community* / *Link devices* and the beta warning.
2. **Join community** three-way choice screen.
3. **Open invite link** (explanatory) + **Paste a link to Join** (the WIP frame’s intent: title, one input with placeholder *Link*, *Continue*; keep the title bar, drop the leftover avatar/subtitle from the duplicated create screen — note this in the PR as an interpretation of an unfinished frame).
4. **Join with QR code** sheet (mobile: scan; desktop: no camera — show the QR *display* and route to paste).
5. **Create a community** (name + *Continue*); **Choose username** with the real helper copy. Community icon upload/crop: **out** (needs an asset pipeline; note as phase 2).
6. **Link devices** entry from Get started → the #3400 `LinkedDevices` / `LinkedDeviceQRCode` surfaces, with the design’s copy on the entry screen and the *Linked devices / No linked devices* list.
7. **Desktop variants of all of the above** — the prototype is mobile-only (375 wide); desktop = the 600px modal body the app uses, built from the same tokens. Render every screen in Storybook at both widths (the `RealScreens` harness pattern).
8. Apply the type scale to the components touched.

**Out of phase 1 (record as follow-ups):** recover account (no mechanism designed), plans / subscriptions / App Store (no product), community icon crop, moving the QSS offer to post-creation, `Agree-and-join (v1)` joiner screen (unwired).

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
| QR code scan (camera) | none — desktop has no camera; scan = paste link | none on this branch; check #3400 for a scanner or deep-link only | Mobile scanner may need a camera dependency — verify in #3400 before adding one |
| Icons: Person add · gear · badge2 · caret · check · arrow-up · Close · Back | ui/Icon.tsx + @mui/icons-material | mobile/src/assets/icons (check names) | Map each to an existing icon; do not draw new ones |
| Illustrations: Monster · group illustration on Join community | static asset (export SVG from Figma node) | static asset (export SVG from Figma node) | Export via Figma images API format=svg; never redraw |
| Wireframe text · Placeholder | — (design placeholders) | — | Not UI |

98 of the 99 components used by the 39 screens are instances from the published Quiet Design Library; the most-used are Divider, icon glyphs, the Title bar zones, Avatar, Button row, Button, List item, Input3.0.

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
Implemented by: desktop `none — app opens in Join/Create modals` · mobile `none — app opens on JoinCommunity screen`

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
Implemented by: desktop `CreateJoinCommunity/JoinCommunity/JoinCommunity.tsx (paste field)` · mobile `JoinCommunity/JoinCommunity.component.tsx (paste field)`

### create--default  ·  `create-default`
Section: Onboarding · 375×667 · node `2811:2451` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2451)

Copy:
- Create a community
- Name your community and add a custom icon.
- UPLOAD
- Add a name for your community
- Community name
- Caption
- Continue

Uses: Create community (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Edit profile avatar (1)
Goes to: Edit profile avatar → ios-photo-gallery-2811-2501 [prototype]; Avatar-action → ios-photo-gallery-2811-2501 [prototype]; Input3.0 → create-populated-focussed [prototype]; Glyph → back [back]
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

### Open invite link  ·  `open-invite-link`
Section: Onboarding · 375×667 · node `2811:2455` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2455)

Copy:
- Join with invite link
- Open an invite link from a community admin. (If you just installed Quiet, open the invite again!)
- Paste a link

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Invite link (1), Monster (1)
Goes to: Button → container [added]; Glyph → back [back]
Implemented by: desktop `CreateJoinCommunity/PerformCommunityActionComponent.tsx` · mobile `JoinCommunity/JoinCommunity.component.tsx`

### Sheet (2811:2460)  ·  `sheet-2811-2460`
Section: Onboarding · 375×499 · node `2811:2460` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2460)

Copy:
- Join with QR code

Uses: Join--scan code--QR (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), QR camera mockup (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### recover-account-info  ·  `recover-account-info`
Section: Onboarding · 375×667 · node `2811:2535` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2535)

Copy:
- Account recovery
- Recover account
- Locked out? You can recover with a linked device or ask an admin to send you an invite link.
- Use linked device
- Subtitle
- Use invite link
- More options
- Scan QR code

Uses: ButtonIcons (8), Divider (5), Button row (4), caret-black-r (4), Title bar/Logged in (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1)
Goes to: Content → link-devices [prototype]; Button row → open-invite-link [prototype]; Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### iOS photo gallery (2811:2501)  ·  `ios-photo-gallery-2811-2501`
Section: Onboarding · 375×585 · node `2811:2501` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2501)

Uses: 
Goes to: Frame 1628 → crop-photo-3 [prototype]; hotspot-back → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### create--populated-focussed  ·  `create-populated-focussed`
Section: Onboarding · 375×667 · node `2811:2453` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2453)

Copy:
- Create a community
- Name your community and add a custom icon.
- UPLOAD
- Add a name for your community
- nyc-activism
- Caption
- Continue

Uses: Create community (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Edit profile avatar (1)
Goes to: Glyph → get-started [prototype]; Edit profile avatar → ios-photo-gallery-2811-2467 [prototype]; Avatar-action → ios-photo-gallery-2811-2467 [prototype]; Button → username-default [prototype]
Implemented by: desktop `CreateCommunity.tsx` · mobile `CreateCommunity.component.tsx`

### Sheet (2811:2601)  ·  `sheet-2811-2601`
Section: Onboarding · 375×442 · node `2811:2601` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2601)

Copy:
- QR code
- Scan this from “Link devices” on another device to link the devices.
- Reset QR code

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Link devices--display code--QR (1), qr-code-box (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Sheet (2811:2587)  ·  `sheet-2811-2587`
Section: Onboarding · 375×571 · node `2811:2587` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2587)

Copy:
- Scan QR code
- Go to “Link devices” on the other device and display the QR code. Scan it to link devices.

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Link devices--scan code--QR (1), QR camera mockup (1)
Goes to: Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Paste a link to Join (frame 'Container', WIP)  ·  `container`
Section: Onboarding · 375×667 · node `3190:10892` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3190-10892)
> Designer's work in progress: this frame is create--default duplicated with only the heading changed to 'Paste a link to Join' and the input placeholder to 'Link'. Title bar, subtitle and the avatar upload are unchanged.

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
Implemented by: desktop `PerformCommunityActionComponent.tsx (invite field)` · mobile `JoinCommunity.component.tsx`

### crop photo 3  ·  `crop-photo-3`
Section: Onboarding · 375×667 · node `2811:2394` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2394)

Copy:
- Done
- Crop  photo
- Create channel
- Every new message
- Add members
- Settings

Uses: ButtonIcons (6), Divider (4), Button row (3), check-black (3), caret-black-r (3), Title bar/Logged in (1), RightZ (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: RightZ → join-photo-no-name [prototype]; icon-plus → crop-photo-4 [prototype]; Ellipse 463 → crop-photo-4 [prototype]; Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### iOS photo gallery (2811:2467)  ·  `ios-photo-gallery-2811-2467`
Section: Onboarding · 375×585 · node `2811:2467` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2467)

Uses: 
Goes to: Frame 1628 → crop-photo-1 [prototype]; hotspot-back → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### username--default  ·  `username-default`
Section: Onboarding · 375×679 · node `2811:2371` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2371)

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

### join-photo-no-name  ·  `join-photo-no-name`
Section: Onboarding · 375×667 · node `2811:2368` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2368)

Copy:
- Create a community
- Name your community and add a custom icon.
- Add a name for your community
- Community name
- Caption
- Continue

Uses: Create community (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), Edit profile avatar (1)
Goes to: LeftZ → get-started [prototype]; Input3.0 → join-photo-name-true-2811-2366 [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### crop photo 4  ·  `crop-photo-4`
Section: Onboarding · 375×667 · node `2811:2432` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2432)

Copy:
- Done
- Crop  photo
- Create channel
- Every new message
- Add members
- Settings

Uses: ButtonIcons (6), Divider (4), Button row (3), check-black (3), caret-black-r (3), Title bar/Logged in (1), RightZ (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: RightZ → join-photo-no-name [prototype]; Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### crop photo 1  ·  `crop-photo-1`
Section: Onboarding · 375×667 · node `2811:2375` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2375)

Copy:
- Done
- Crop  photo
- Create channel
- Every new message
- Add members
- Settings

Uses: ButtonIcons (6), Divider (4), Button row (3), check-black (3), caret-black-r (3), Title bar/Logged in (1), RightZ (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: RightZ → join-photo-name-true-2811-2364 [prototype]; icon-plus → crop-photo-2 [prototype]; Ellipse 463 → crop-photo-2 [prototype]; Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### username-populated  ·  `username-populated`
Section: Onboarding · 375×679 · node `2811:2373` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2373)

Copy:
- Create a community
- Choose username
- Enter a username
- Denise
- Your username will be public, but you can choose any name you like. No spaces or special characters. Lowercase letters and numbers only.
- Continue

Uses: Username (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Input3.0 (1)
Goes to: Glyph → create-populated-focussed [prototype]; Button → community-home [prototype]
Implemented by: desktop `CreateUsername/CreateUsernameComponent.tsx` · mobile `Registration/UsernameRegistration.component.tsx`

### join-photo+name-true (2811:2366)  ·  `join-photo-name-true-2811-2366`
Section: Onboarding · 375×667 · node `2811:2366` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2366)

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

### join-photo+name-true (2811:2364)  ·  `join-photo-name-true-2811-2364`
Section: Onboarding · 375×667 · node `2811:2364` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2364)

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

### crop photo 2  ·  `crop-photo-2`
Section: Onboarding · 375×667 · node `2811:2413` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2811-2413)

Copy:
- Done
- Crop  photo
- Create channel
- Every new message
- Add members
- Settings

Uses: ButtonIcons (6), Divider (4), Button row (3), check-black (3), caret-black-r (3), Title bar/Logged in (1), RightZ (1), TitleZ (1), LeftZ (1), Close (1)
Goes to: RightZ → join-photo-name-true-2811-2364 [prototype]; Close → back [back]
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

### Community switcher (2853:1955)  ·  `community-switcher-2853-1955`
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
Implemented by: desktop `ServerOffer/ServerOfferComponent.tsx` · mobile `ServerOffer/CreatingOffer/ServerOffer.component.tsx`

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
Goes to: Button → agree-and-join-server-opt-in-3054-4090 [prototype]; Button → agree-and-join-server-opt-in-2924-13388 [prototype]; Button → agree-and-join-server-opt-in-2924-13388 [prototype]; Glyph → community-home [prototype]
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

### Agree-and-join (server opt-in) (3054:4090)  ·  `agree-and-join-server-opt-in-3054-4090`
Section: Onboarding · 375×700 · node `3054:4090` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3054-4090)

Copy:
- Agree & join
- This community uses a server (api.tryquiet.org) for messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (2), Divider (2), RightZ (2), Placeholder (2), Avatar (2), TitleZ (2), LeftZ (2), Back (2), Button (2), arrow-up (2)
Goes to: Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]; Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `TermsOfService/TermsOfService.component.tsx`

### Agree-and-join (server opt-in) (2924:13388)  ·  `agree-and-join-server-opt-in-2924-13388`
Section: Onboarding · 375×700 · node `2924:13388` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2924-13388)

Copy:
- Agree & join
- This community uses a server (api.tryquiet.org) for messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Button (1), arrow-up (1)
Goes to: Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-2924-13413 [prototype]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `TermsOfService/TermsOfService.component.tsx`

### Captcha (3054:4052)  ·  `captcha-3054-4052`
Section: Onboarding · 375×700 · node `3054:4052` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3054-4052)
> Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent — the captcha closes, the new community shows, then the captcha returns; less likely if you wait before clicking) and #3368 (offline: no loading or timeout message, and a 'joining' screen while creating).

Copy:
- CAPTCHA
- VERIFY
- Select all images with a bicycle.

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1)
Goes to: Glyph → agree-and-join-server-opt-in-3054-4090 [prototype]; Frame → home-add-members [prototype]
Implemented by: desktop `renderer/captcha.html + main/preload.captcha.ts` · mobile `Captcha/CaptchaModal.component.tsx`

### Captcha (2924:13413)  ·  `captcha-2924-13413`
Section: Onboarding · 375×700 · node `2924:13413` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2924-13413)
> Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent) and #3368 (no loading/timeout message when hCAPTCHA cannot load; 'joining' shown while creating).

Copy:
- CAPTCHA
- VERIFY
- Select all images with a bicycle.

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1)
Goes to: Glyph → agree-and-join-server-opt-in-2924-13388 [prototype]; Frame → click-to-subscribe [prototype]
Implemented by: desktop `renderer/captcha.html + main/preload.captcha.ts` · mobile `Captcha/CaptchaModal.component.tsx`

### Home add members  ·  `home-add-members`
Section: Onboarding · 375×700 · node `2932:3681` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3681)

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
Goes to: Home add members → add-members-options [prototype]; Avatar and switcher → community-switcher-2940-3271 [prototype]; List item → add-members-options [prototype]
Implemented by: desktop `Channel/ChannelComponent.tsx` · mobile `Chat/Chat.component.tsx`

### Click to subscribe  ·  `click-to-subscribe`
Section: Onboarding · 375×700 · node `2930:3493` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2930-3493)

Uses: Wireframe text (7), Logo-icon (1)
Goes to: Click to subscribe → overlay-app-store [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Add members options  ·  `add-members-options`
Section: Onboarding · 375×404 · node `2932:3709` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3709)

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
Goes to: Button row → add-members-qr-code [prototype]; Button row → ios-views-activity-views-share-dark [prototype]; Glyph → back [back]
Implemented by: desktop `Settings/Tabs/Invite/Invite.component.tsx` · mobile `QRCode/QRCode.component.tsx`

### Community switcher (2940:3271)  ·  `community-switcher-2940-3271`
Section: Onboarding · 320×700 · node `2940:3271` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2940-3271)

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
Goes to: Person add → add-members-options [prototype]; Glyph → back [back]; Glyph → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Overlay: App Store  ·  `overlay-app-store`
Section: Onboarding · 375×432 · node `2930:3444` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2930-3444)

Uses: Wireframe text (7), Logo-icon (1)
Goes to: Hotspot → home-add-members [prototype]; Hotspot → choose-a-plan [prototype]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Add members--QR code  ·  `add-members-qr-code`
Section: Onboarding · 375×552 · node `2932:3707` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3707)

Copy:
- QR code
- This community QR code is private. If it is shared with someone, they can scan it with their camera to join this community.
- Share code
- Reset QR code

Uses: Add members--QR code (1), Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Close (1), qr-code-box (1)
Goes to: Close → back [back]
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### iOS / Views / Activity Views / Share - Dark  ·  `ios-views-activity-views-share-dark`
Section: Onboarding · 375×453 · node `2932:3712` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=2932-3712)

Copy:
- Quiet Community
- quiet.app
- Hugo 
Collins
- Laura
Scott
- Anne 
Frank
- Jasper
Jacobs
- Maik’s
Macbook Pro
- Message
- Mail
- Messenger
- Whatsapp
- Twitter

Uses: os-icon (1), Icon Center Image Artwork (1), Icon / close (1)
Implemented by: desktop `— (intermediate state)` · mobile `— (intermediate state)`

### Agree-and-join (v1 before we support multiple hosts)  ·  `agree-and-join-v-1-before-we-support-multiple-hosts`
Section: Server agree (joiner, v1) · 375×700 · node `3111:4339` · [Figma](https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd?node-id=3111-4339)
> 'v1 before we support multiple hosts' — joiner-side agree screen. Not linked from Open invite link or username in the prototype. The implementation shows JoiningOptIn + TermsOfService after username.

Copy:
- Use Quiet’s server?
- This community will use Quiet’s server for end-to-end encrypted messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.
- Agree & Join

Uses: Title bar/Logged in (1), Divider (1), RightZ (1), Placeholder (1), Avatar (1), TitleZ (1), LeftZ (1), Back (1), Button (1), arrow-up (1)
Goes to: Glyph → choose-a-plan [prototype]; Frame 1612 → captcha-3054-4052 [prototype]
Implemented by: desktop `TermsOfService/TermsOfServiceComponent.tsx` · mobile `ServerOffer/JoiningOptIn/JoiningOptIn.component.tsx`


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

## E2E requirements for the implementation PR

- Desktop: extend `packages/e2e-tests/src/tests/` following `multipleClients.test.ts` / `multipleClients.qss.test.ts` (two clients, selenium): cover Get started → three-way join → paste link → username; create → username; and **device linking multiplayer**: client A creates a community and generates a device link (`LinkedDevices` tab); client B joins via that link as the *same user’s second device*; both show the community; a message sent from B appears on A; A’s device list shows B; unlink from A and B loses access.
- Mobile: build on `packages/mobile/e2e` and the Appium work in #3483; the same device-linking scenario with an Android emulator as the second device where the harness allows, otherwise desktop↔mobile.
- Every new story passes `sb-gate.sh` and is agent-verified before the PR is called ready; `tsc --noEmit` on every commit (the Storybook build is babel-only).
