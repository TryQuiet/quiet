// Generates screens/OnboardingFlow.stories.tsx from figma/flow.json.
// Storybook derives a story's id from the EXPORT NAME (storyNameFromExport → toId),
// not from `storyName`, so export identifiers are chosen so the derived id equals
// `onboarding-flow--<slug>`, and that equality is asserted here with @storybook/csf.
const fs = require('fs'); const path = require('path')
const { toId, storyNameFromExport } = require('@storybook/csf')
const TITLE = 'Onboarding flow'
const flowPath = path.join(__dirname, '..', 'figma', 'flow.json')
const flow = JSON.parse(fs.readFileSync(flowPath, 'utf8'))
// 'ios-photo-gallery-2811-2501' -> 'IosPhotoGallery_2811_2501' : words PascalCased, numeric runs underscored
const exportFor = slug => slug.split('-').map(w => (/^\d+$/.test(w) ? '_' + w : w[0].toUpperCase() + w.slice(1))).join('')
const expectId = slug => `${toId(TITLE, 'x').split('--')[0]}--${slug}`
// Purged screens (user decision, 2026-09-12): Apple system UI captured as stages, exact duplicates that differ
// only in prototype wiring, extra input states of one screen, and placeholder art. Both Agree & join screens stay —
// opt-in consent is a step in the process. Value = the kept screen that links into the purged one now go to;
// null = the link is dropped (dead end). Purged exports are deleted from figma/ so nothing stale ships.
const PURGE = {
  'ios-photo-gallery-2811-2501': 'crop-photo-3',
  'ios-photo-gallery-2811-2467': 'crop-photo-3',
  'ios-views-activity-views-share-dark': null,
  'overlay-app-store': null,
  'crop-photo-4': 'crop-photo-3',
  'crop-photo-1': 'crop-photo-3',
  'crop-photo-2': 'crop-photo-3',
  'join-photo-name-true-2811-2364': 'join-photo-name-true-2811-2366',
  'community-switcher-2940-3271': 'community-switcher-2853-1955',
  'agree-and-join-server-opt-in-2924-13388': 'agree-and-join-server-opt-in-3054-4090',
  'captcha-2924-13413': 'captcha-3054-4052',
  'click-to-subscribe': null,
  'create-populated-focussed': 'join-photo-name-true-2811-2366',
  'join-photo-no-name': 'join-photo-name-true-2811-2366',
}
const before = flow.frames.length
flow.frames = flow.frames.filter(f => !(f.slug in PURGE))
for (const f of flow.frames) {
  f.links = f.links.flatMap(l => {
    if (!l.target || !(l.target in PURGE)) return [l]
    const t = PURGE[l.target]
    if (t === null || t === f.slug) { console.log(`  link dropped: ${f.slug} → ${l.target} (${l.label})`); return [] }
    console.log(`  link re-targeted: ${f.slug} → ${l.target} ⇒ ${t} (${l.label})`); return [{ ...l, target: t }]
  })
}
for (const slug of Object.keys(PURGE)) { const png = path.join(__dirname, '..', 'figma', slug + '.png'); if (fs.existsSync(png)) { fs.unlinkSync(png); console.log(`  export removed: figma/${slug}.png`) } }
console.log(`purged ${before - flow.frames.length} of ${before} screens; ${flow.frames.length} remain`)
// Sidebar / map / side-panel names: the screen's own title (its title-bar text, else its heading,
// else the Figma frame name — never an invented label), a real visible state after an em dash,
// pixel-identical frames that only differ in prototype wiring marked "(copy)", Apple system screens
// "(iOS)". Keyed by slug so ids (derived from slugs) never change.
const DISPLAY = {
  'get-started': 'Get started',
  'join-community': 'Join community',
  'create-default': 'Create a community',
  'join-photo-name-true-2811-2366': 'Create a community — filled',
  'crop-photo-3': 'Crop photo',
  'link-devices': 'Link devices',
  'sheet-2811-2601': 'Link devices — QR code (sheet)',
  'sheet-2811-2587': 'Link devices — Scan QR code (sheet)',
  'open-invite-link': 'Join with invite link',
  'container': 'Paste a link to Join (WIP)',
  'sheet-2811-2460': 'Join with QR code (sheet)',
  'recover-account-info': 'Account recovery',
  'username-default': 'Choose username',
  'username-populated': 'Choose username — name typed',
  'community-home': 'Community home',
  'home-add-members': 'Community home — add members',
  'community-switcher-2853-1955': 'Community switcher',
  'want-a-server': 'Want a server?',
  'no-server': 'No server?',
  'choose-a-plan': 'Choose a plan',
  'agree-and-join-server-opt-in-3054-4090': 'Agree & join — server opt-in',
  'captcha-3054-4052': 'CAPTCHA',
  'add-members-options': 'Add members',
  'add-members-qr-code': 'Add members — QR code',
  'agree-and-join-v-1-before-we-support-multiple-hosts': 'Use Quiet’s server? (v1)',
}
const rows = []
for (const f of flow.frames) {
  const exp = exportFor(f.slug); const id = toId(TITLE, storyNameFromExport(exp)); const want = expectId(f.slug)
  if (id !== want) { console.error(`ID MISMATCH ${f.slug}: export ${exp} -> ${id}, wanted ${want}`); process.exit(1) }
  f.id = id; f.export = exp; f.display = DISPLAY[f.slug] ?? f.display; rows.push(f)
  // Figma exports include drop shadows, so a frame with a shadow comes back larger than its box (the switcher:
  // 352×732 for a 320×700 frame). Record the margin so the image is painted at natural size and hotspots stay true.
  const png = fs.readFileSync(path.join(__dirname, '..', 'figma', f.png)); const pw = png.readUInt32BE(16) / 2, ph = png.readUInt32BE(20) / 2
  const padX = Math.round((pw - f.width) / 2), padY = Math.round((ph - f.height) / 2)
  if (padX || padY) f.pad = { x: padX, y: padY }; else delete f.pad
}
for (const k of Object.keys(DISPLAY)) if (!flow.frames.some(f => f.slug === k)) { console.error(`DISPLAY has no frame for slug ${k}`); process.exit(1) }
const dups = rows.map(f => f.display).filter((d, i, a) => a.indexOf(d) !== i)
if (dups.length) { console.error(`duplicate display names: ${[...new Set(dups)].join(' | ')}`); process.exit(1) }
// Desktop renderings from the designer's own desktop frames (user, 2026-09-12: "sidebar on left and chat in the
// rest of the screen" and "there should be plenty of designs on this in figma already"). Per stage: kind 'app' =
// a 740-wide split-view frame — drawn at 740; wider windows keep [0,right) at the left edge and [right,740) at
// the right edge and fill the gap by stretching the plain column at `col` (only designer pixels); kind 'content' =
// 715-wide content inside the Modal full-window shell. Want a server? and CAPTCHA have designer desktop frames
// too (2840:6698, 2840:6724) but they are the 375 card at (170,64) on a transparent 715 canvas — the geometry
// the shell composition of the mobile frame already produces — so they need no entry (see Desktop designs). Hotspots are measured on the export (1×) and
// wired to the targets of the mobile frame's own links, matched by label — or to 'back'. Nothing else is drawn.
const DESKTOP = {
  'community-home': { kind: 'app', png: 'desktop-community-home-empty.png', node: '1430:48044', width: 740, height: 800, stretch: { col: 600, right: 640 }, hotspots: [
    { x: 52, y: 47, w: 126, h: 26, label: 'Community name', from: 'Avatar and switcher' },
    { x: 186, y: 47, w: 24, h: 24, label: 'Gear → community menu (Add members)', to: 'home-add-members', kind: 'added' },
  ] },
  'home-add-members': { kind: 'app', png: 'desktop-community-menu-open.png', node: '1430:48372', width: 740, height: 800, stretch: { col: 290, right: 325 }, hotspots: [
    { x: 365, y: 109, w: 375, h: 49, label: 'Add members row', from: 'Home add members' },
    { x: 380, y: 18, w: 28, h: 28, label: 'Back arrow', back: true },
  ] },
  'community-switcher-2853-1955': { kind: 'app', png: 'desktop-community-switcher-overlay.png', node: '1104:38645', width: 740, height: 646, stretch: { col: 600, right: 640 }, hotspots: [
    { x: 288, y: 282, w: 28, h: 26, label: 'Person add (VibeVillage row)', from: 'Person add' },
    { x: 66, y: 100, w: 24, h: 24, label: 'Close', back: true },
  ] },
  'choose-a-plan': { kind: 'content', png: 'desktop-choose-a-plan.png', node: '2840:6718', width: 715, height: 929, hotspots: [
    { x: 32, y: 297, w: 103, h: 48, label: 'Upgrade (Free)', from: 'Button', nth: 0 },
    { x: 265, y: 297, w: 104, h: 48, label: 'Upgrade ($20)', from: 'Button', nth: 1 },
    { x: 498, y: 297, w: 103, h: 48, label: 'Upgrade ($40)', from: 'Button', nth: 2 },
    { x: -1, y: -1, w: 0, h: 0, label: 'Back', back: true },
  ] },
}
for (const f of flow.frames) delete f.desktop // derived; never carried over from a previous run
for (const [slug, d] of Object.entries(DESKTOP)) {
  const f = flow.frames.find(x => x.slug === slug); if (!f) { console.error(`DESKTOP has no frame for slug ${slug}`); process.exit(1) }
  const hotspots = d.hotspots.map(h => {
    if (h.back) return { x: h.x, y: h.y, w: h.w, h: h.h, label: h.label, target: null, kind: 'back' }
    if (h.to) { if (!flow.frames.some(x => x.slug === h.to)) { console.error(`DESKTOP ${slug}: unknown target ${h.to}`); process.exit(1) } return { x: h.x, y: h.y, w: h.w, h: h.h, label: h.label, target: h.to, kind: h.kind ?? 'added' } }
    const cands = f.links.filter(l => l.label === h.from && l.kind !== 'back'); const from = cands[h.nth ?? 0]
    if (!from) { console.error(`DESKTOP ${slug}: no link labelled ${h.from} #${h.nth ?? 0}`); process.exit(1) }
    return { x: h.x, y: h.y, w: h.w, h: h.h, label: h.label, target: from.target, kind: from.kind }
  })
  f.desktop = { kind: d.kind, png: d.png, node: d.node, width: d.width, height: d.height, stretch: d.stretch ?? null, hotspots }
}
const mapId = toId(TITLE, storyNameFromExport('AllStages'))
flow.mapId = mapId
fs.writeFileSync(flowPath, JSON.stringify(flow, null, 1))
const L = [
  '// GENERATED by design-system/flow/gen.cjs from figma/flow.json — do not hand-edit.',
  '// One story per screen reachable from "Get started" via the prototype\'s own links.',
  '// Export names are chosen so Storybook\'s derived id equals `onboarding-flow--<slug>`; gen.cjs asserts it.',
  "import React from 'react'", '', "import flowJson from '../figma/flow.json'",
  "import { DesktopDesigns, Flow, FlowMap, FLOW_TITLE, Stage } from '../flow/FigmaFlow'", '',
  'const flow = flowJson as Flow', 'const frame = (slug: string) => flow.frames.find(f => f.slug === slug)!', '',
  'export default {', '  title: FLOW_TITLE,', "  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },", '}', '',
  'export const AllStages = () => <FlowMap flow={flow} />', "AllStages.storyName = '— all stages —'", '',
  'export const DesktopDesigns_ = () => <DesktopDesigns flow={flow} />', "DesktopDesigns_.storyName = 'Desktop — designs'", '',
]
for (const f of rows) L.push(`export const ${f.export} = () => <Stage flow={flow} frame={frame(${JSON.stringify(f.slug)})} />`, `${f.export}.storyName = ${JSON.stringify(f.display)}`, '')
fs.writeFileSync(path.join(__dirname, '..', 'screens', 'OnboardingFlow.stories.tsx'), L.join('\n'))
// gate rows: id<TAB>export-name needle
fs.writeFileSync('/mnt/storage/holmes-tmp/gate-ids.txt', [[mapId, 'AllStages'], [toId(TITLE, storyNameFromExport('DesktopDesigns_')), 'DesktopDesigns_'], ...rows.map(f => [f.id, f.export])].map(r => r.join('\t')).join('\n') + '\n')
console.log(`generated ${rows.length} stories; ids verified with @storybook/csf; map id ${mapId}`)
