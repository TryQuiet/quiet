# Design consistency audit — desktop renderer

Branch `design/consistency-audit` (cut from `design/onboarding-impl` @ d11b65189), 2026-09-13.
Scope: everything in `packages/desktop/src/renderer` that is *not* already being fixed on
`design/onboarding-impl` (those items are listed as **in flight** below and were not touched).

**The design** is, in this order: the tokens in `design-system/tokens` (4px grid; Rubik 400/500 only;
radii 4 · 8 · 16), the decisions in `ONBOARDING.md` (Modal full-window shell, centred titles), and the
Figma files indexed for this project — the Quiet Design Library `0j7Nna9zWmfOSNmRmQK1Uh` (node ids
below are from that file unless another key is given), the mobile prototype `f6Nr5b5wtvk6Xoh1HJZ8Dd`
and the desktop drafts `y8h6w8PYR9jyI3zjYHL9Cl` / `8R3jXuoUxhNyczcClFTrDm` / `ux7na5q5H8S34vho3NOVcV`.
Every "design says" cell cites a node, a token or a spec line; where the design is silent the row says so.

## Summary

| status | count |
|---|---|
| fixed on this branch | 73 |
| in flight on `design/onboarding-impl` (not touched) | 4 rows; the in-flight register below lists 8 items |
| not fixed (reason in the row) | 18 |
| already consistent with the design (recorded for completeness) | 4 |
| **findings** | **99** (T theme · S sidebar · C channel view · I composer · M modals · D drawers/settings), plus N1 |

One-place fixes carry most of it: `design-system/theme/components.ts` (new) holds MUI overrides cited to
library nodes — `MuiOutlinedInput` (Input3.0), `MuiTooltip` (Tooltip-content), `MuiPopover` / `MuiMenu` /
`MuiMenuItem` (Overlay menu), `MuiDialog` (modal/small), `MuiButton.outlined` (the action bar's secondary
button), `MuiListItemButton` selected (Search result) and the body text on the body role — and
`theme.ts` spreads it into both themes, adds the palette colours `ink` (#222222), `error10` (Light/Error 10)
and corrects `statusGreen` and the caption colour. Component edits then remove the copies of those
numbers and snap the rest to the grid and the scale.

Line numbers below are as of d11b65189 (the audited tree). Screenshots: `before` = the static Storybook
built from d11b65189, `after` = this branch, both taken with headless Chrome from the story iframe:
`/mnt/storage/holmes-tmp/audit-sb/shots/{before,after}/<story id>.png`. The pairs that matter most are
embedded under `figma/audit/` (before on the left, after on the right).

Severity: **H** visible in the first-run / onboarding experience or on every screen; **M** visible in a
common screen; **L** cosmetic or rare.

## Findings

### Theme (one place)

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| T1 | `theme.ts` MuiCssBaseline body | body text pinned to 14/24 | `tokens.type.body` 14/20 (`gridTheme.ts` already overrode it for stories; the app didn't) | M | **fixed** 53b6db10f |
| T2 | `theme.ts:47` caption colour `#b2b2b2` | lightGray captions | `Caption` fill #999999 = gray40 (Input3.0 `5077:43242` → `4515:15847`) | M | **fixed** |
| T3 | MUI OutlinedInput defaults (CreateChannel, ChangeUsername, AddMembers, CreateUsername, PasteLink, profile editor) | radius 4, 56 tall, 16px text, 2px primary-purple focus ring, grey stroke | `Input3.0` `5077:43258`: box `5077:43158` 42 tall, radius 8, 1px #999999; focussed `5077:43164` 1px #1B6FEC (linkBlue); text 14 in a 24 slot; placeholder #7F7F7F (`1933:47078;4395:14384`) | H | **fixed** `MuiOutlinedInput` |
| T4 | `ui/Tooltip/Tooltip.tsx:13-23` | bg #000 (trueBlack), 12px w500, padding 12/16, marginBottom 5 | `Tooltip-content` `3490:10102`: fill #222222, radius 8, padding 8/16, Rubik 14/20 w400 white; caret `3490:10085` same ink | M | **fixed** `MuiTooltip`; Tooltip.tsx keeps only first-letter capitalisation |
| T5 | `theme.ts` MuiPopover paper radius 8; `ui/PopupMenu/PopupMenu.tsx:25-26` shadow 0 2 25 @0.2, radius 8; `ui/MenuAction/MenuAction.tsx:24-28` padding 24, radius 8; `MenuActionItem.tsx:16-20` 14px, letterSpacing 0.4, padding 5, minHeight 25 | menus on the modal's shadow, 8px corners, 35px rows | `Overlay menu` `5578:43731`: radius 16, 16 top/bottom, DROP_SHADOW 0 6 30 #000 @0.11 (now `theme.shadows[6]`); rows `Button row` `5578:43515` 48 tall (16/26 text in 11px → 12/16 on the grid) | L (no menu is mounted in the app today) | **fixed** `MuiPopover`/`MuiMenu`/`MuiMenuItem` |
| T6 | `ui/QuitApp/QuitAppDialog.tsx` (MUI Dialog defaults) | paper radius 4, MUI elevation | `modal/small` `3505:10356`: radius 8, DROP_SHADOW 0 2 25 @0.20 (`theme.shadows[4]`) | L | **fixed** `MuiDialog` |
| T7 | Secondary buttons: `DeleteChannel:68-80`, `LeaveCommunity:62-74`, `UpdateModal:58-70`, `AddMembersChannel:78-90` | a *contained* white 160×40 button in darkGray whose hover does nothing | `action bar / Buttons=Single with Cancel` `3505:10336`: Cancel `3505:10321` = white, 1px #B3B3B3 (border02), Rubik 14/20 w400, padding 6/12 | M | **fixed** `MuiButton.outlined` + `variant='outlined'` in the four modals (corner radius follows MuiButton root — in flight) |
| T8 | `theme.ts` statusGreen `#9BD174` | online dots in an off-palette green | `Core/Grass Green` #80B857, the `Online indicator` fill (`4610:17230`) | L | **fixed** be8a09537 |
| T9 | `theme.ts` palette lacks the library's text/ink and error tint | tooltip/banner colours were literals in components | #222222 is the fill of the library's text nodes and Tooltip-content; `Light/Error 10` #FAEAEB is a library fill style | L | **fixed** `colors.ink`, `colors.error10` |
| T10 | `theme.ts` MuiButton root (textTransform, radius, hover/pressed/focus) | every modal restates `textTransform: 'none'`, its own height/width and a no-op hover | library `Button` radius 16 (`3505:10318`, `4837:16701`) | H | **in flight** — `design/onboarding-impl` edits MuiButton and `ui/interactionStates.ts`; not touched here |

### Sidebar

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| S1 | `Sidebar/SidebarComponent.tsx:25` | `paddingTop: '30px'` | the window-controls bar is 36 tall (`controls - mac` `6218:12325`; Modal full-window `Top container` `5825:29939`) | M | **fixed** 9219708a8 |
| S2 | `Sidebar/IdentityPanel/IdentityPanel.tsx:17-19` | `marginTop: spacing(1)` (8), 16px literals | `Team and search` `6218:12324`: 16 below the controls, 16 side padding | M | **fixed** |
| S3 | `Sidebar/ChannelsPanel/ChannelsListItem.tsx:51,73` | `fontWeight: 300` (Rubik Light is not bundled → renders 400) | `List item` `3797:16039` text 14/20 w400 at 70%; `RubikWeight = 400 \| 500` (`tokens/types.ts`) | M | **fixed** |
| S4 | `ChannelsListItem.tsx:66,79` unread | `fontWeight: 600` — faux-bold synthesised by the browser | only 400/500 exist; unread in the design is `badge2` (`4953:16853`, 16px #E42656 pill) not bold text | H | **fixed** weight → 500; the badge needs unread counts (see N1) |
| S5 | `ChannelsListItem.tsx:71,74`, JSX `gap='1px'` | lock `marginLeft: 13.5`, `paddingRight: 2`, 1px gap | row padding 16, glyph→text gap 4 (`3797:16039` pad [16,3,16,3] gap 4) | L | **fixed** |
| S6 | `ui/Sidebar/SidebarHeader.tsx:22` | `marginTop: 25` | sidebar sections are 32 apart (`Content` gap, `6218:12285`); `List title` 14/20 w500 at 70% (`3797:15987`) ✓ | M | **fixed** |
| S7 | `SidebarHeader.tsx:49-52` | dead `tooltip` class: `marginTop: -1`, `backgroundColor: 'blue'` | — | L | **fixed** (removed) |
| S8 | `Sidebar/UserProfilePanel/UserProfilePanel.tsx:51` | `fontWeight: 300` | `Profile summary` `6218:12330`: 24px avatar r4, name 14/20 w400 at 70% | M | **fixed** |
| S9 | `UserProfilePanel.tsx:37` | hover `rgba(255,255,255,0.10)` literal | the row hover token `sidebarHover` (#FFFFFF@0.05, `List item / State=Hover` `3797:16112`) | L | **fixed** |
| S10 | `Sidebar/DirectMessagesPanel/UserProfileListItem.tsx:66` | `fontWeight: 300` | `List item--people` `4606:16449` 14/20 w400 | M | **fixed** |
| S11 | `widgets/sidebar/QuickActionButton.tsx:33-41` | icon margins 2 / -2 / 5 / 2 | row glyph 12×12 with a 4px gap (`3797:16037`, `6218:12287`) | L | **fixed** |
| S12 | `widgets/sidebar/MoreButton.tsx:23,34` | hover `rgba(0,0,0,0.08)`, `marginTop: 5` | `sidebarHover`; 4 | L | **fixed** |
| S13 | `ChannelsListItem` hover/selected | `#FFFFFF0C` / `#FFFFFF19` | `State=Hover` #FFFFFF@0.05 `3797:16112`, `State=Selected` @0.10 `3797:16118` — equal within rounding | — | consistent, no change |
| S14 | `Sidebar/TorStatus.tsx:28-42` | paddingLeft 18, marginBottom 3, radius 100px, `#0EA02E`/`#D13135` literals | — | L | **not fixed**: rendered only when `NODE_ENV === 'development'` |
| S15 | `IdentityPanel.tsx` `textTransform: 'capitalize'` | "Rockets" | Desktop sidebar V1 shows the name as typed (`nyc-activism`, `6218:16898`); the prototype's switcher capitalises (`Nyc activism`, `2853:1955`) | L | **not fixed**: the two designs disagree; needs the designer |

### Channel view

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| C1 | `widgets/channels/ChannelHeader.tsx:33-35` | `height: '75px'`, paddingRight 24 | `Panel title bar / Type=Channel` `3526:11541`: `Top` pad [20,16,20,16], divider #F0F0F0; 16 + (24+20) + 16 on the token line-heights = 76 | M | **fixed** 55b777edd |
| C2 | `ChannelHeader.tsx:41-58` | title `fontSize: '1rem'`, `lineHeight: '1.68'` on `subtitle1`; `subtitle` 0.8rem, `subtitleSmall` 0.7rem/0.9, `spendButton` 13, `tab` 12/18 — the last four unused | title 16/26 w500 (`3526:11541` → h5 role 16/24 w500) | M | **fixed** (h5; dead styles removed) |
| C3 | `ChannelHeader.tsx:106` kebab | `cursor: pointer`, no hover, `padding: 20` | the library's icon hover is a #F0F0F0 round tint (`State=Hover menu icon` `4873:18663`); the kebab sits 20 from the edge | M | **fixed** hover = border01, radius 16, padding 8 |
| C4 | `widgets/channels/BasicMessage.tsx:75-79` | sender `fontSize: 16, fontWeight: 500, marginTop: -4, marginRight: 5` | `Header` `4924:18238`: name 16/26 w500 (`4924:17610`), 8 to the time (`4924:17609` gap 8) → h5 + 8 | M | **fixed** |
| C5 | `BasicMessage.tsx:116-119` | time `fontSize: 14`, `#B2B2B2`, `marginTop: -2` | `Time` `4924:17611`: 14/20 #999999 (gray40) | M | **fixed** |
| C6 | `BasicMessage.tsx:96-107,150-155` | avatar box 40, `marginRight: 10`, 2px offsets, photo marginRight 8 | `Avatar type` 36×36 r4 (`4910:23682`); gap 14 → 12 on the grid | L | **fixed** |
| C7 | `BasicMessage.tsx:56` | hover `background.paper` (#F0F0F0) | `Message container / State=Hover` `4910:24211` fill #F7F7F7 (gray03) | L | **fixed** |
| C8 | `BasicMessage.tsx:52` + MUI ListItem padding | avatar 20 from the edge, 8/8 vertical | `Message top` `4910:23700` pad top 10 / bottom 12, avatar at x=16 → 8/12 on the grid | L | **fixed** |
| C9 | `widgets/channels/TextMessage.tsx:28-30` | `fontSize: '0.855rem'`, `lineHeight: '21px'` (no variant) | `Message` text `4910:23681` Rubik 14/20 = body role | H | **fixed** |
| C10 | `TextMessage.tsx:35-36` | emoji-only `1.7rem` / 42px | twice the body on the grid: 28/40 | L | **fixed** |
| C11 | `widgets/channels/NestedMessageContent.tsx:24-26` | `0.855rem` / 21px | body role | H | **fixed** |
| C12 | `widgets/channels/ChannelMessages.tsx:59,62` | `padding: '9px 16px'`, `fontWeight: 'bold'` | 8/16; 500 | L | **fixed** |
| C13 | `Channel/NewMessagesInfo/NewMessagesInfoComponent.tsx:25-40` | 200×40 pill (radius 50), `0.855rem`/21 | `alert-new-messages` `1058:618`: 32 tall, radius 8, #521C74, 12/16 white | M | **fixed** |
| C14 | `widgets/DateDivider.tsx:34-44`, `FloatingDate.tsx` | 13px, padding 5/18, radius 72, marginTop 20 | `Date marker` `5063:26712` / `5063:27435`: Rubik 13/15.4, pad [18,5,18,5], radius 72 — matches, but 13 is not on the type scale and 5/18 not on the grid | L | **not fixed**: the design itself is off-scale; needs a designer call (caption 12/16 or body 14/20) |
| C15 | `BasicMessage.tsx:62` | info messages on `colors.blue` #2196f3 `!important` | no library node for an info message; #2196f3 is not a library colour | L | **not fixed**: no design |
| C16 | `widgets/channels/WelcomeMessage.tsx:38-70` | 16/14 literals, `marginTop: -35`, `marginLeft: 50` | — | L | **not fixed**: unused (no importer); delete candidate |
| C17 | `Channel/File/FileAttachmentPreview.tsx:30-94` | radius `15%`/`100%`, margins 10/51/50 | no library node for the attachment preview found | L | **not fixed**: no design |
| C18 | `MathMessage/MathMessageComponent.tsx:30,34` | margins 5 | — | L | **not fixed**: no design; inline math |

### Composer

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| I1 | `widgets/channels/ChannelInput/ChannelInput.tsx:102` | textfield `borderRadius: 4` | `Compose input` radius 16 (desktop `y8h6w8PYR9jyI3zjYHL9Cl` `1933:47078;4395:14382`; library `I4912:27441;5022:19568`) | H | **fixed** a5f9f7716 |
| I2 | `ChannelInput.tsx:84,88` | placeholder `#aaa` | `Send a message` placeholder #7F7F7F = darkGray (`1933:47078;4395:14384`) | M | **fixed** |
| I3 | `ChannelInput.tsx:110-111` | `inputsDiv` padding 20 | `Compose row` side padding 16 (`1933:47078`) — the same 16 as the message avatars | M | **fixed** |
| I4 | `ChannelInput.tsx:140-152` | icon button `#808080`, hover `black` literals | palette darkGray / text.primary | L | **fixed** |
| I5 | `ChannelInput.tsx:163-184` | padding 5, right 15, margins 5 | grid: 4 / 16 / 4 | L | **fixed** |
| I6 | `ChannelInput.tsx:75-80` | input 14/24 in 12/16 padding (48 tall) | text container pad [16,11,16,11] with 14/20 = 42 tall (`I4912:27441;5022:19570`) | L | **not fixed**: 11 is off the grid; 12+24+12 = 48 is on it, and the toolbar row is tuned to 48 |
| I7 | `ChannelInput.tsx:98` | border `border01` #F0F0F0 | stroke #E5E5E5 (`4395:14382`) — no palette entry, no library colour style | L | **not fixed**: nearest token kept, recorded for the palette |
| I8 | `ChannelInput/EmojiDropdown.tsx:15-35,43-70` | `#2a2a2a` / `#ffffff` / `#333333` / `#E5E5E5`, hover `rgba(50,100,255,…)`, shadow 0 5 20 @0.3 | `Overlay menu` `5578:43731` (radius 16 ✓, shadow 0 6 30 @0.11); rows `Search result` `3799:12467`: hover #000@0.06 (`5671:24701`), selected #1B6FEC + white (`3799:12466`) | M | **fixed** |
| I9 | `ChannelInput/MentionPoper.tsx:23-26` | radius 8, shadow 0 2 25 @0.2, marginBottom 10 | Overlay menu radius 16 + `shadows[6]`; 8 | L | **fixed** |
| I10 | `ChannelInput/MentionElement.tsx:23,42,53-57` | paddingTop 10, marginLeft 9, caption 12/18 letterSpacing 0.4 `rgba(0,0,0,0.6)`, highlight lushSky | 12 / 8; caption role; text.secondary; selected row #1B6FEC (`3799:12466`) | L | **fixed** |
| I11 | `ChannelInput/ChannelInputInfoMessage.tsx:21,27` | `fontWeight: 'bold'`, padding 0/20 | 500; 0/16 | L | **fixed** |

### Modals and the shell

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| M1 | `ui/Modal/Modal.tsx:60-65,120-124` | title 15/18 w400; `isBold` = 16/26 w500 | `Title bar/Logged in` title Rubik 16/26 w500 (`I5476:42171;3606:13264;3606:13770`; the shell `5825:29938` → `6002:27130`) → h5 for every modal title | H | **fixed** 53b6db10f (`isBold` is now a no-op) |
| M2 | `Modal.tsx:69` | `addBorder` uses border03 #D2D2D2 | the bar's divider is #F0F0F0 (`I3505:10357;3505:10235`) = border01 | M | **fixed** |
| M3 | `Modal.tsx:77-78,198` | action gutter 10; title offset 36 (title not centred on the bar) | bar padding 16 (`3505:10230`) = 8 + the icon button's 8; offset 56 = the action column's width | L | **fixed** |
| M4 | `Modal.tsx:49,56-57` | `padding: '0 15%'`, windowed `25vh/25vw` | the shell's width rule above 715 is the open question in ONBOARDING.md | L | **not fixed**: no design |
| M5 | `Channel/CreateChannel/CreateChannelComponent.tsx:225` | an h3 "Create a new channel" in the body, no shell title | `Create channel / Version=3` `5055:16131`: the title is in the Title bar; ONBOARDING.md "Modal full-window shell" | M | **fixed** 5056c8907 (title → Modal `title`; the text and test ids are unchanged) |
| M6 | `CreateChannelComponent.tsx:87,120,126` | error 12px literal, offset 5, subtitle -2 | caption role; 4; 0 | L | **fixed** |
| M7 | `CreateChannelComponent.tsx:52-62`, `DeleteChannel:49-61`, `LeaveCommunity:34-46`, `Invite:39-49`, `UpdateModal:33-36`, `WarningModal:33-36`, `ErrorModal:47-51`, `OpenlinkModal:63-70`, `UnregisteredModal:17-27`, `PossibleImpersonation:21-31`, `ui/LoadingButton` | primary buttons: heights 40/48/55/60, widths 147/150/165/190/260, hover = same colour or opacity 0.7, radius 8 in some, default in others | one primary `Button` (`4837:16701` r16 16/26; `3505:10318`) with states | H | **in flight** (MuiButton root + `interactionStates.ts` on `design/onboarding-impl`) |
| M8 | `Channel/DeleteChannel/DeleteChannelComponent.tsx:68-80` | "Never mind" = white contained 160×40 | secondary = outlined (`3505:10321`) | M | **fixed** (T7) |
| M9 | `DeleteChannelComponent.tsx:46` | `marginTop: 25` | 24 | L | **fixed** |
| M10 | `Settings/Tabs/LeaveCommunity/LeaveCommunityComponent.tsx:62-74` | "Leave community" = white contained | outlined (`3505:10321`). Note the destructive action is the *secondary* button here and "Go back" the primary; the library's action bar puts the action on the filled button (`3505:10336`) | M | **fixed** variant; the primary/secondary swap is a product decision, recorded |
| M11 | `widgets/update/UpdateModal.tsx:30,35,58-70` | marginTop 38, `0.9rem`, "Later" white contained | 40; theme size; outlined | M | **fixed** |
| M12 | `widgets/WarningModal/WarningModal.tsx:29,34` | marginTop 38, `0.9rem` | 40; theme size | L | **fixed** |
| M13 | `widgets/userLabel/duplicate/DuplicateModal.component.tsx:25`, `unregistered/UnregisteredModal.component.tsx:17`, `possibleImpersonationAttackModal/…component.tsx:24` | margins 30 | 32 | L | **fixed** |
| M14 | `ui/QuitApp/QuitAppDialog.tsx:37,42` | padding 10 | 12 (+ T6) | L | **fixed** |
| M15 | `ui/ErrorModal/ErrorModalComponent.tsx:40` | stack trace 14px literal | body role | L | **fixed** |
| M16 | `ui/OpenlinkModal/OpenlinkModal.tsx:54,58` | `fontWeight: 600`, label 14/24 | 500; 14/20 | L | **fixed** |
| M17 | `ErrorModal:33`, `OpenlinkModal:36` | icon `fontSize: '10rem'` on an `<Icon>` (an img — no effect) | — | L | **not fixed**: dead property |
| M18 | `Channel/AddMembersChannel/AddMembersChannelComponent.tsx:64,104-125,275-280` | `1rem`/1.68 literals, margin 5, marginTop 25, paddingLeft 2px, inline `fontWeight: 500, fontSize: 16` | bodyLg role; 4; 24; h5 | L | **fixed** (also the white secondary → outlined, and the story title collision `Components/DeleteChannel` → `Components/AddMembersChannel`) |
| M19 | `ChangeUsername/ChangeUsername.component.tsx:58,128` | margin 5px, marginBottom 2 | 4; 0 | L | **fixed** |
| M20 | `SearchModal/SearchModelComponent.tsx:54-95,123` | icons 18/14, padding 24, hover/focus lushSky + white, caret `#2288FF` | `Search bar` `3797:17977`: 24px search/close glyphs, `top` pad 16 (`3797:17958`); `Search result` rows 8/16 (`3799:12461`), hover #000@0.06 (`5671:24701`), selected #1B6FEC + white (`3799:12466`); caret linkBlue | M | **fixed** |
| M21 | `LoadingPanel/JoiningPanelComponent.tsx:56`, `StartingPanelComponent.tsx:33,36` | heading `fontSize: '18px'` on `h2`; image marginBottom 58 | 18/27 was the pre-grid h4 → title role 20/28; 56 | M | **fixed** |
| M22 | `ServerOffer/ServerOfferComponent.tsx:93-104` | Chip pill radius 4, 51-tall button, 14px literals | prototype `Want a server?` `2922:10009` | M | **not fixed**: an onboarding stage owned by `design/onboarding-impl` (`Components/Onboarding`, `FigmaFlow` DESKTOP map) |
| M23 | `ui/Modal` close/back glyph (`ui/Icon/IconButton.tsx:15`) | `padding: 6` under a descendant selector that never matches (MUI's 8 applies) | — | L | **in flight** (IconButton is edited on `design/onboarding-impl`) |

### Context menus, drawers, settings

| # | where | the app | the design | sev | status |
|---|---|---|---|---|---|
| D1 | `ContextMenu/ContextMenu.component.tsx:67` | `fontSize={16} fontWeight={'medium'}` — `medium` is not a CSS font-weight, so every drawer title renders at 400 | Title bar title 16/26 w500 (`3606:13770`) → h5 | H | **fixed** 5056c8907 |
| D2 | `ContextMenu.component.tsx:120` | rows `padding: '11px 16px'`, no hover | `Button row` 48 tall (`5578:43515`, 11 → 12 on the grid); hover = the library's row wash (`5671:24701`) | M | **fixed** |
| D3 | `ContextMenu.component.tsx:43` | `paddingTop: 12` inside a 60-tall centred bar (title sits 6 low) | 60-tall bar, centred | L | **fixed** |
| D4 | `ContextMenu.component.tsx:62` | `gap: '1px'` | 4 | L | **fixed** |
| D5 | `ContextMenu/menus/ChannelContextMenu.container.tsx:103` | icon `fontWeight: 'medium'` | — (invalid) | L | **fixed** |
| D6 | `ContextMenu/menus/UserProfileContextMenu.container.tsx:56-58` | nickname 16/500 literals | h5 | L | **fixed** |
| D7 | `UserProfileContextMenu.container.tsx:61-77` | username field: border02, padding 16, 14px literals | `Input3.0` `5077:43158`: 1px #999999, 8/16, 42 tall, radius 8; title 14/20 #4C4C4C (`5077:43259`) | M | **fixed** |
| D8 | `UserProfileContextMenu.container.tsx:401-407` | error banner `#ffebee` / `#b71c1c` | `Light/Error 10` #FAEAEB + `Core/Error` #D13135 | L | **fixed** (`colors.error10`, `error.main`) |
| D9 | `UserProfileContextMenu.container.tsx:80-92` edit-photo button | pad 6/12, radius 16, border02, 14/20 | = `3505:10321` exactly | — | consistent, no change |
| D10 | `Settings/SettingsComponent.tsx:57` | `sx={{ fontWeight: '500' }}` | h5 | L | **fixed** |
| D11 | `Settings/Tabs/Notifications/NotificationsComponent.tsx:43-44,66-67,76,91,100`; `Attachments/AttachmentsComponent.tsx:37,60,70,78` | subtitles 18/27 over `h5`; labels 14/25; offsets 5 / 23 / 1 | 18/27 was h4 → title role 20/28; body role 14/20; 4 / 24 / 0 | M | **fixed** |
| D12 | `Settings/Tabs/Invite/Invite.component.tsx:34-35,52,67` | link 13px letterSpacing -0.4; `bold`; margin 5 | link text 14/20 (prototype `Add members` `I2932:3711;4391:18645`); 500; 4 | L | **fixed** |
| D13 | `Settings/Tabs/LinkedDevices/LinkedDevices.component.tsx:50,57` | 13px, margin 5 | — | L | **in flight** (file has uncommitted edits on `design/onboarding-impl`) |
| D14 | `ui/Slider/Slider.tsx:28,36` | padding 5/10, `0.83rem` | 4/8; caption role | L | **fixed** |
| D15 | Settings rows (`SettingsComponent.tsx`) | MUI ListItemButton 8/16 + 16px text = 48 | `Button row` 48 (`5578:43515`) | — | consistent |
| D16 | `ui/Tabs/Tabs.tsx:17-28` | padding 10/8/8/8, 14/21, radius 5 | `Tabs` `5014:16769`: pad 16, 14/26, selected = #1B6FEC underline, hover #F7F7F7 | L | **not fixed**: unused (exported, never rendered) |
| D17 | `ui/QuickActionLayout/QuickActionLayout.tsx:40-53` | `fontWeight: 'bold'`, 0.9rem/1.2rem, spacing(1.2/1.6) | — | L | **not fixed**: unused; delete candidate |
| D18 | `ui/Switch/IOSSwitch.tsx:20-50` | `#65C466` `#2ECA45` `#33cf4d` `#E9E9EA` `#39393D` | the library's toggle (`5055:16350` row, 52×32) carries no fills in the export; iOS system colours | L | **not fixed**: needs the toggle's fills from the designer |
| D19 | `widgets/userLabel/UserLabel.component.tsx:22-25` | margin -4/8/0/4, padding 1/6, radius 8 | no library "user label" component found | L | **not fixed**: no design |
| D20 | `debugInfo/debugChannelComponent.tsx`, `debugInfoComponent.tsx` | 13/18/16/12px, radius 12/6, `fontWeight: 600`, `#bdbdbd` | — | L | **not fixed**: development-only panel |
| D21 | `windows/Loading.tsx:61` | `fontSize: 16` | — | L | **not fixed**: no design for the loading window |
| D22 | `ContextMenu` / `Settings` drawers width 375 | 375 | prototype sheets are 375 wide; `Community switcher / Type=Desktop` `5476:42949` is 320 | — | consistent (375 is the shell's content column) |

### In flight elsewhere (recorded, not touched)

| # | item | where it is being done |
|---|---|---|
| F1 | primary button radius / shape (theme `MuiButton` root) and its hover / pressed / focus states | `design/onboarding-impl`: `theme.ts` MuiButton, `ui/interactionStates.ts`, `ui/LoadingButton`, `ui/Icon/IconButton` |
| F2 | hover / pressed / focus on the onboarding controls (rows, links, glyph buttons) | same |
| F3 | the logo asset (square vs the design's circle) | same |
| F4 | Agree & join / ToS and CAPTCHA screens | same |
| F5 | Add members / QR code restructure | `design/onboarding-qr-scan` |
| F6 | captcha logic | same |
| F7 | `Onboarding/*` buttons `borderRadius: 8` (`PasteLinkComponent.tsx:58`, `CreateCommunityComponent.tsx:57`, `CreateUsernameComponent.tsx:70`) vs the library's 16 | folds into F1 |
| F8 | `LinkedDevices.component.tsx` (D13), `IconButton` padding (M23) | `design/onboarding-impl` |

### Not fixed

Rows S14, S15, C14–C18, I6, I7, M4, M17, M22, D16–D21 above: dev-only code (S14, D20), unused
components (C16, D17, D16), no design node to cite (C15, C17, C18, M4, D19, D21), the design itself
off-grid (C14, I6), a colour the palette and the library both lack (I7), a dead property (M17), an
onboarding stage owned by the other branch (M22), and two that need the designer (S15, D18).

**N1 — unread badge.** The sidebar marks unread channels by weight; the design uses `badge2`
(`4953:16853`, 16px #E42656 pill with a count). Needs unread counts in state — product/data work,
not styling.

## Storybook

New: `Components/Consistency` (`design-system/screens/Consistency.stories.tsx`, snapshots disabled) —
*Controls* (tooltips open above/below, Input3.0 default/focussed/error, outlined vs primary button, an
open overlay menu, the new-messages banner), *Settings tabs* (Notifications, Files and Images),
*Modal title bar*, *Quit dialog*. Every other component touched already had a story under
`Components/*`; those stories show the corrected state unchanged. `Components/AddMembersChannel` was
titled `Components/DeleteChannel` (an id collision with the real Delete channel story) and is renamed.

## Verification

- `npx tsc --noEmit -p tsconfig.json` in `packages/desktop`: clean (with the `3rd-party/auth` submodule
  checkout linked in for the run; without it seven pre-existing errors in `../types` / `../state-manager`
  come from the missing `3rd-party/auth/packages/auth/dist`, on d11b65189 too).
- jest, `src/renderer/components`: 72 suites, 181 passed, 1 skipped, 1 todo; 64 inline snapshots updated
  (emotion class hashes plus the intended markup changes: modal title offset, Create channel title in the
  bar, loading headings h2 → h4, Add members name on h5). RTL: `channel.add`, `searchModal`,
  `channel.main`: 29 passed, 2 skipped.
- prettier: clean on every changed file except `theme.ts`, which prettier 2.3 cannot parse at all
  (`import { createTheme, type Theme }` on line 1, pre-existing on d11b65189).
- `npm run build-storybook`: succeeds; the static build was served on 127.0.0.1:6401 and every story
  listed under "screenshots looked at" was screenshotted with headless Chrome and inspected.
