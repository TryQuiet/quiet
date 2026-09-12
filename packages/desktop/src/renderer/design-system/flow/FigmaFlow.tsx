import React, { useState } from 'react'
import { linkTo } from '@storybook/addon-links'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { createGridTheme } from '../theme/gridTheme'
import { tokens } from '../tokens'
// The chat pane of the desktop split view is the real ChannelComponent, from its own story (no recreation).
import * as ChannelStories from '../../components/Channel/Channel.stories'

import { IMPLEMENTATION, IMPLEMENTATION_ONLY, Impl } from './implementation'
import { INK, INK_2, INK_3, mono, RULE } from '../specimen/ui'

export type LinkKind = 'prototype' | 'added' | 'back'
export interface FlowLink { x: number; y: number; w: number; h: number; label: string; target: string | null; kind: LinkKind; note?: string }
export interface FlowFrame {
  slug: string; name: string; display: string; node: string
  /** Story id, derived from the export name by gen.cjs and verified with @storybook/csf. */
  id: string
  section: string
  width: number; height: number; png: string; url: string; note?: string | null
  /** The frame's own title bar, if it has one: its height (to crop when composed into the desktop shell) and its title text. */
  titleBar?: { height: number; text: string | null } | null
  /** Shadow margin the Figma export carries beyond the frame's box (effects render into exports); painted at natural size, offset by it. */
  pad?: { x: number; y: number } | null
  /** Desktop in-app rendering: 'app' = V1 desktop sidebar + chat pane, 'app-panel' = the desktop switcher over that view; absent = onboarding modal shell. */
  desktop?: { mode: 'app' | 'app-panel'; hotspots: FlowLink[] } | null
  links: FlowLink[]
}
export interface DesktopApp {
  sidebar: { png: string; node: string; width: number; height: number; bg: string }
  switcher: { png: string; node: string; width: number; height: number; inset: number }
}
export interface Rect { x: number; y: number; w: number; h: number }
export interface Shell { file: string; node: string; png: string; width: number; height: number; topBar: { y: number; h: number }; titleBar: { y: number; h: number }; titleZone: Rect; backZone: Rect; content: Rect }
export interface Flow { file: string; start: string; sections: string[]; shell?: Shell; desktopApp?: DesktopApp; mapId?: string; frames: FlowFrame[] }

export const FLOW_TITLE = 'Onboarding flow'

// Every PNG is the designer's own export of the frame, at 2x, shown at 1x.
const images = (require as any).context('../figma', false, /\.png$/)
const src = (png: string): string => images(`./${png}`)
const desktopImages = (require as any).context('../figma/desktop', false, /\.png$/)
const dsrc = (png: string): string => desktopImages(`./${png}`)
import desktopJson from '../figma/desktop.json'
export interface DesktopDesign { slug: string; file: string; fileName: string; date: string; node: string; name: string; width: number; height: number; png: string; url: string; copy: string[]; counterpart: string | null; note: string }
const DESKTOP = desktopJson as DesktopDesign[]

export const storyIdFor = (f: FlowFrame): string => f.id

/** Under the manager, addon-links selects the story; as a bare iframe there is no manager, so re-route the iframe itself. */
const navigate = (f: FlowFrame): void => {
  if (window.parent !== window) linkTo(FLOW_TITLE, f.display)()
  else {
    const u = new URL(window.location.href)
    u.searchParams.set('id', storyIdFor(f)); u.searchParams.set('viewMode', 'story')
    window.location.assign(u.toString())
  }
}

// A real history stack, so a drawn back arrow or close button behaves like one.
// sessionStorage survives the bare-iframe reload and the manager's in-place story switch alike.
const HIST = 'onboarding-flow-history'
const readHist = (): string[] => { try { return JSON.parse(sessionStorage.getItem(HIST) || '[]') } catch { return [] } }
const writeHist = (h: string[]): void => { try { sessionStorage.setItem(HIST, JSON.stringify(h.slice(-50))) } catch { /* private mode */ } }

const KIND_STYLE: Record<LinkKind, { bg: string; border: string; word: string }> = {
  prototype: { bg: 'rgba(13,100,32,0.08)', border: '1px dashed rgba(13,100,32,0.75)', word: 'prototype link' },
  added: { bg: 'rgba(138,95,9,0.10)', border: '1px solid rgba(138,95,9,0.8)', word: 'added for review' },
  back: { bg: 'rgba(31,58,104,0.08)', border: '1px dotted rgba(31,58,104,0.8)', word: 'inferred back' },
}
const KIND_INK: Record<LinkKind, string> = { prototype: '#0D6420', added: '#8A5F09', back: '#1F3A68' }

const ImplRow: React.FC<{ label: string; impl: Impl }> = ({ label, impl }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 8, fontSize: 12, lineHeight: '17px' }}>
    <span style={{ color: INK_3, fontFamily: mono, fontSize: 11 }}>{label}</span>
    {impl.status === 'none' ? (
      <span style={{ color: '#A11F24' }}>none — {impl.why}</span>
    ) : (
      <span style={{ fontFamily: mono, fontSize: 11, color: impl.status === 'pr3400' ? '#8A5F09' : INK, wordBreak: 'break-all' }}>
        {impl.path}{impl.status === 'pr3400' ? '  (PR #3400, not on this branch)' : ''}
      </span>
    )}
  </div>
)

const Eyebrow: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 14 }) => (
  <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_3, marginTop: top }}>{children}</div>
)

// ---- viewport: mobile sizes are the frame itself (scaled); desktop sizes are a COMPOSITION:
// the library's Modal full-window shell with this screen's content placed in its content area,
// the screen's own title bar removed and its title moved to the shell's title slot. Composed per
// the decided desktop model — it is not a designed desktop screen.
type Viewport = 'mobile' | 'mobile-430' | 'shell' | 'win-1024' | 'win-1280' | 'win-1440'
const VIEWPORTS: Array<{ id: Viewport; label: string; width: number }> = [
  { id: 'mobile', label: 'Mobile 375 (native)', width: 375 },
  { id: 'mobile-430', label: 'Mobile 430 (scaled)', width: 430 },
  { id: 'shell', label: 'Desktop — Modal full-window 715', width: 715 },
  { id: 'win-1024', label: 'Desktop window 1024', width: 1024 },
  { id: 'win-1280', label: 'Desktop window 1280', width: 1280 },
  { id: 'win-1440', label: 'Desktop window 1440', width: 1440 },
]
const VP_KEY = 'onboarding-flow-viewport'
const writeVp = (v: Viewport): void => { try { sessionStorage.setItem(VP_KEY, v) } catch { /* private mode */ } }
const isVp = (v: string | null): v is Viewport => !!v && VIEWPORTS.some(x => x.id === v)
// `?vp=<id>` on the iframe URL wins (deep links from the launcher, and the render gate); otherwise the last choice this session.
const readVp = (): Viewport => {
  try {
    const q = new URLSearchParams(window.location.search).get('vp')
    if (isVp(q)) { writeVp(q); return q }
    const v = sessionStorage.getItem(VP_KEY)
    return isVp(v) ? v : 'mobile'
  } catch { return 'mobile' }
}

const Hotspot: React.FC<{ l: FlowLink; rect: Rect; outline: boolean; onClick: () => void; describe: (l: FlowLink) => string }> = ({ l, rect, outline, onClick, describe }) => {
  const st = KIND_STYLE[l.kind]
  return (
    <button
      type="button"
      data-kind={l.kind}
      title={`${l.label} → ${describe(l)} · ${st.word}`}
      aria-label={`${l.label}: ${l.kind === 'back' ? 'go back' : 'go to ' + describe(l)} (${st.word})`}
      onClick={onClick}
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, background: outline ? st.bg : 'transparent', border: outline ? st.border : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 0 }}
    />
  )
}

/** The screen at a viewport, with hotspots re-mapped so the click-through works at every size. */
type StoryFn = ((args: Record<string, unknown>) => JSX.Element) & { args?: Record<string, unknown> }
const renderStory = (s: StoryFn) => s(s.args ?? {})

/** Desktop once the community exists (decided 2026-09-12: "sidebar on left and chat in the rest of the screen"):
 *  the library's V1 desktop sidebar (220, carries the mac controls) and the chat filling the rest of the window.
 *  The chat is the real ChannelComponent from its own story — the only designed chat content is a skeleton. */
const AppAt: React.FC<{ flow: Flow; frame: FlowFrame; vp: Viewport; outline: boolean; follow: (l: FlowLink) => void; describe: (l: FlowLink) => string }> = ({ flow, frame, vp, outline, follow, describe }) => {
  const app = flow.desktopApp!; const sb = app.sidebar; const mode = frame.desktop!.mode
  const winW = Math.max(VIEWPORTS.find(v => v.id === vp)!.width, 1024)
  const H = flow.shell?.height ?? 929
  const panelTop = 36 // the switcher drops from the sidebar's community header, below the mac controls
  return (
    <div style={{ position: 'relative', width: winW, height: H, background: '#fff', border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: sb.width, height: H, background: sb.bg }}>
        <img src={dsrc(sb.png)} width={sb.width} height={sb.height} alt="Desktop sidebar — V1 release" style={{ display: 'block' }} />
      </div>
      <div style={{ position: 'absolute', left: sb.width, top: 0, width: winW - sb.width, height: H, overflow: 'auto', background: '#fff' }}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={createGridTheme(tokens)}>{renderStory(ChannelStories.Normal as unknown as StoryFn)}</ThemeProvider>
        </StyledEngineProvider>
      </div>
      <div style={{ position: 'absolute', right: 10, top: 8, zIndex: 2, fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_3, background: '#ffffffcc', padding: '2px 6px', borderRadius: 3 }}>chat = real ChannelComponent (code)</div>
      {mode === 'app' && frame.desktop!.hotspots.map((l, i) => <Hotspot key={i} l={l} rect={{ x: l.x, y: l.y, w: l.w, h: l.h }} outline={outline} onClick={() => follow(l)} describe={describe} />)}
      {mode === 'app-panel' && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 0, width: winW, height: H, background: '#00000029' }} />
          <img src={dsrc(app.switcher.png)} width={app.switcher.width} height={app.switcher.height} alt={frame.name} style={{ position: 'absolute', left: -app.switcher.inset, top: panelTop - app.switcher.inset, display: 'block' }} />
          {frame.links.map((l, i) => <Hotspot key={i} l={l} rect={{ x: l.x, y: panelTop + l.y, w: l.w, h: l.h }} outline={outline} onClick={() => follow(l)} describe={describe} />)}
        </>
      )}
    </div>
  )
}

const ScreenAt: React.FC<{ flow: Flow; frame: FlowFrame; vp: Viewport; outline: boolean; follow: (l: FlowLink) => void; describe: (l: FlowLink) => string }> = ({ flow, frame, vp, outline, follow, describe }) => {
  const shell = flow.shell
  if (vp !== 'mobile' && vp !== 'mobile-430' && frame.desktop && flow.desktopApp) return <AppAt flow={flow} frame={frame} vp={vp} outline={outline} follow={follow} describe={describe} />
  if (vp === 'mobile' || vp === 'mobile-430' || !shell) {
    const s = vp === 'mobile-430' ? 430 / frame.width : 1
    return (
      <div style={{ position: 'relative', width: Math.round(frame.width * s), height: Math.round(frame.height * s), border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
        <img src={src(frame.png)} width={Math.round((frame.width + 2 * (frame.pad?.x ?? 0)) * s)} height={Math.round((frame.height + 2 * (frame.pad?.y ?? 0)) * s)} alt={frame.name}
          style={{ display: 'block', position: 'relative', left: -Math.round((frame.pad?.x ?? 0) * s), top: -Math.round((frame.pad?.y ?? 0) * s) }} />
        {frame.links.map((l, i) => (
          <Hotspot key={i} l={l} rect={{ x: l.x * s, y: l.y * s, w: l.w * s, h: l.h * s }} outline={outline} onClick={() => follow(l)} describe={describe} />
        ))}
      </div>
    )
  }
  // Desktop: the shell's CHROME (36px top bar with window controls, 60px title bar with back
  // arrow and centered title) drawn to the window width, a white content area to full height,
  // and the screen's 375-wide content centered in it. The library export is not painted here:
  // its body is the placeholder slot ("Replace with content"), i.e. grey by design.
  const winW = VIEWPORTS.find(v => v.id === vp)!.width
  const crop = frame.titleBar?.height ?? 0
  const contentLeft = Math.round((winW - frame.width) / 2)
  const contentTop = shell.content.y
  const title = frame.titleBar?.text ?? ''
  const H = shell.height
  return (
    <div style={{ position: 'relative', width: winW, height: H, background: '#fff', border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden', fontFamily: "'Rubik', sans-serif" }}>
      {/* top bar: window controls */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: winW, height: shell.topBar.h, background: '#fff', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: '#C4C4C4', display: 'inline-block' }} />)}
      </div>
      {/* title bar: back arrow + centered title, divider below */}
      <div style={{ position: 'absolute', left: 0, top: shell.titleBar.y, width: winW, height: shell.titleBar.h, boxSizing: 'border-box', background: '#fff', borderBottom: '1px solid #E5E5E5' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', left: shell.backZone.x + 2, top: shell.backZone.y - shell.titleBar.y + 2 }} aria-hidden="true">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#171B12" />
        </svg>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: INK }}>{title}</div>
      </div>
      {/* content area: white to the bottom; the screen's content, its own title bar cropped, centered */}
      <div style={{ position: 'absolute', left: contentLeft, top: contentTop, width: frame.width, height: H - contentTop, overflow: 'hidden', background: '#fff' }}>
        <img src={src(frame.png)} width={frame.width} height={frame.height} alt={frame.name} style={{ display: 'block', transform: `translateY(-${crop}px)` }} />
      </div>
      {frame.links.map((l, i) => {
        if (l.y < crop) {
          return l.kind === 'back' || l.label === 'Glyph' || l.label === 'Close' ? (
            <Hotspot key={i} l={l} rect={shell.backZone} outline={outline} onClick={() => follow(l)} describe={describe} />
          ) : null
        }
        return <Hotspot key={i} l={l} rect={{ x: contentLeft + l.x, y: contentTop + l.y - crop, w: l.w, h: l.h }} outline={outline} onClick={() => follow(l)} describe={describe} />
      })}
    </div>
  )
}

export const Stage: React.FC<{ flow: Flow; frame: FlowFrame }> = ({ flow, frame }) => {
  const [outline, setOutline] = useState(true)
  const [vp, setVp] = useState<Viewport>(readVp)
  const bySlug = Object.fromEntries(flow.frames.map(f => [f.slug, f]))
  const impl = IMPLEMENTATION[frame.slug]
  const incoming = flow.frames.filter(f => f.links.some(l => l.target === frame.slug))

  const go = (t: FlowFrame): void => { const h = readHist(); h.push(frame.slug); writeHist(h); navigate(t) }
  const back = (): void => {
    const h = readHist(); let prev = h.pop()
    while (prev === frame.slug) prev = h.pop()
    writeHist(h)
    const t = prev ? bySlug[prev] : undefined
    if (t) return navigate(t)
    navigate(incoming.length === 1 ? incoming[0] : bySlug[flow.start])
  }
  const follow = (l: FlowLink): void => {
    if (l.kind === 'back') return back()
    const t = l.target ? bySlug[l.target] : undefined
    if (t) go(t)
  }
  const describe = (l: FlowLink): string => l.kind === 'back' ? 'back (history)' : (l.target && bySlug[l.target] ? bySlug[l.target].display : String(l.target))
  const isDesktop = vp !== 'mobile' && vp !== 'mobile-430'

  return (
    <div style={{ display: 'flex', gap: 32, padding: 24, alignItems: 'flex-start', fontFamily: "'Rubik', sans-serif", color: INK, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {VIEWPORTS.map(v => (
            <button key={v.id} type="button" data-viewport={v.id} aria-pressed={vp === v.id} onClick={() => { setVp(v.id); writeVp(v.id) }}
              style={{ font: 'inherit', fontSize: 12, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${vp === v.id ? '#0D6420' : RULE}`, background: vp === v.id ? '#0D642014' : '#fff', color: vp === v.id ? '#0D6420' : INK_2 }}>{v.label}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <ScreenAt flow={flow} frame={frame} vp={vp} outline={outline} follow={follow} describe={describe} />
        </div>
        <label style={{ display: 'block', marginTop: 8, fontSize: 12, color: INK_3 }}>
          <input type="checkbox" checked={outline} onChange={e => setOutline(e.target.checked)} /> show link targets
        </label>
        <div style={{ fontSize: 11, color: INK_3, marginTop: 4, lineHeight: '16px', maxWidth: 720 }}>
          <span style={{ color: KIND_INK.prototype }}>green dashed</span> = wired in the Figma prototype ·{' '}
          <span style={{ color: KIND_INK.added }}>amber solid</span> = added for this review ·{' '}
          <span style={{ color: KIND_INK.back }}>blue dotted</span> = drawn back/close, not wired; goes back
        </div>
        {isDesktop ? (
          <p style={{ fontSize: 12, lineHeight: '17px', color: '#8A5F09', margin: '8px 0 0', maxWidth: 720, paddingLeft: 10, borderLeft: '2px solid #8A5F09' }}>
            {frame.desktop ? (<>Desktop in-app view per the decision of 2026-09-12 (&ldquo;sidebar on left and chat in the rest of the screen&rdquo;): the library&rsquo;s V1 desktop sidebar (220) on the left, the chat filling the rest of the window at full height. The chat is the real ChannelComponent from its own story — the only designed chat content is the Pages / Channel--D skeleton. Hotspots follow the mobile frame&rsquo;s own wiring; the 715 size does not apply here (shown at 1024).</>) : (<>Desktop sizes are a composition per the decided model, not a designed screen: the Modal full-window shell&rsquo;s chrome (window controls, title bar with back arrow) drawn to the window width, a white content area, and this screen&rsquo;s content centered in it — its own title bar removed and its title text set in the shell&rsquo;s bar. The library component is 715 wide; stretching it to wider windows is our interpretation.</>)}
          </p>
        ) : vp === 'mobile-430' ? (
          <p style={{ fontSize: 12, lineHeight: '17px', color: INK_3, margin: '8px 0 0', maxWidth: 720 }}>Scaled from the 375-wide frame; the design has no 430-wide variant.</p>
        ) : null}
      </div>

      <div style={{ maxWidth: 420, minWidth: 280, flex: 1 }}>
        <Eyebrow top={0}>stage</Eyebrow>
        <h1 style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, margin: '2px 0 4px', letterSpacing: '-0.01em' }}>{frame.display}</h1>
        <p style={{ fontSize: 12, color: INK_3, margin: '0 0 6px' }}>
          {frame.width}×{frame.height} · node <span style={{ fontFamily: mono }}>{frame.node}</span> ·{' '}
          <a href={frame.url} target="_blank" rel="noreferrer" style={{ color: '#0D6420' }}>open in Figma</a>
          {frame.titleBar?.text ? <> · title bar &ldquo;{frame.titleBar.text}&rdquo;</> : null}
        </p>
        {frame.note ? <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '8px 0 0', paddingLeft: 10, borderLeft: '2px solid #8A5F09' }}>{frame.note}</p> : null}

        <Eyebrow>goes to</Eyebrow>
        {frame.links.length ? (
          <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none' }}>
            {frame.links.map((l, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: '20px' }}>
                <button type="button" onClick={() => follow(l)} style={{ background: 'none', border: 0, padding: 0, color: KIND_INK[l.kind], cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>{describe(l)}</button>
                <span style={{ color: INK_3 }}> ← {l.label}</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: KIND_INK[l.kind], marginLeft: 6 }}>{KIND_STYLE[l.kind].word}</span>
                {l.note ? <div style={{ fontSize: 12, color: INK_2, lineHeight: '17px' }}>{l.note}</div> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 13, color: INK_3, margin: '4px 0 0' }}>end of this branch of the prototype</p>
        )}
        {incoming.length ? (
          <>
            <Eyebrow>reached from</Eyebrow>
            <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none' }}>
              {incoming.map(f => (
                <li key={f.slug} style={{ fontSize: 13, lineHeight: '20px' }}>
                  <button type="button" onClick={() => go(f)} style={{ background: 'none', border: 0, padding: 0, color: '#0D6420', cursor: 'pointer', font: 'inherit' }}>{f.display}</button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <Eyebrow top={18}>implemented by</Eyebrow>
        {impl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            <ImplRow label="desktop" impl={impl.desktop} />
            <ImplRow label="mobile" impl={impl.mobile} />
            {impl.divergence ? <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '6px 0 0', paddingLeft: 10, borderLeft: '2px solid #A11F24' }}>{impl.divergence}</p> : null}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: INK_3, margin: '6px 0 0' }}>not mapped — an intermediate prototype state (photo picker / crop / focus state)</p>
        )}
      </div>
    </div>
  )
}

const Tile: React.FC<{ f: FlowFrame }> = ({ f }) => {
  const impl = IMPLEMENTATION[f.slug]
  const tag = !impl ? 'intermediate' : impl.desktop.status === 'none' && impl.mobile.status === 'none' ? 'no implementation' : impl.desktop.status === 'pr3400' ? 'in PR #3400' : 'implemented'
  return (
    <button type="button" onClick={() => navigate(f)} style={{ background: '#fff', border: `1px solid ${RULE}`, borderRadius: 6, padding: 8, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: INK }}>
      <img src={src(f.png)} alt="" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 3, border: `1px solid ${RULE}` }} />
      <div style={{ fontSize: 12, lineHeight: '16px', marginTop: 6, fontWeight: 500 }}>{f.display}</div>
      <div style={{ fontSize: 10.5, fontFamily: mono, color: tag === 'no implementation' ? '#A11F24' : tag === 'in PR #3400' ? '#8A5F09' : INK_3, marginTop: 2 }}>{tag}</div>
    </button>
  )
}

const SECTION_NOTE: Record<string, string> = {
  Onboarding: 'Reachable from "Get started" by the prototype\u2019s own links (plus one added link to the paste screen). After username the prototype lands on Community home, and from there the server / plan / captcha / subscription cluster is reachable — creator-side, once the community exists. Both apps show that offer during creation instead.',
  'Server opt-in (creator)': 'The QSS server / plan / captcha / subscription cluster, when not already reached from Onboarding.',
  'Server agree (joiner, v1)': 'The joiner-side agree screen ("v1 before we support multiple hosts") and its captcha. Not linked from the join flow in the prototype; the apps show ToS after username.',
}

export const FlowMap: React.FC<{ flow: Flow }> = ({ flow }) => (
  <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: INK, maxWidth: 900 }}>
    <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px' }}>Onboarding flow — every stage</h1>
    <p style={{ fontSize: 13, color: INK_3, margin: '0 0 20px' }}>
      {flow.frames.length} screens in file <span style={{ fontFamily: mono }}>{flow.file}</span>, in {flow.sections.filter(sec => flow.frames.some(f => f.section === sec)).length} clusters the prototype does not connect. Click any stage to open it; the frame&rsquo;s buttons then walk the flow.
    </p>
    {flow.sections.filter(sec => flow.frames.some(f => f.section === sec)).map(sec => (
      <div key={sec} style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_3, margin: '0 0 4px' }}>{sec}</h2>
        {SECTION_NOTE[sec] ? <p style={{ fontSize: 12.5, color: INK_2, margin: '0 0 10px', maxWidth: '70ch' }}>{SECTION_NOTE[sec]}</p> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          {flow.frames.filter(f => f.section === sec).map(f => <Tile key={f.slug} f={f} />)}
        </div>
      </div>
    ))}
    <h2 style={{ fontSize: 13, fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_3, margin: '28px 0 8px' }}>stages the apps have that the prototype does not draw</h2>
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
      <tbody>
        {IMPLEMENTATION_ONLY.map(s => (
          <tr key={s.stage}>
            <td style={{ padding: '6px 10px 6px 0', borderBottom: `1px solid ${RULE}`, whiteSpace: 'nowrap', fontWeight: 500 }}>{s.stage}</td>
            <td style={{ padding: '6px 10px', borderBottom: `1px solid ${RULE}`, fontFamily: mono, fontSize: 11, color: INK_2 }}>{s.desktop ?? '—'}</td>
            <td style={{ padding: '6px 0', borderBottom: `1px solid ${RULE}`, fontFamily: mono, fontSize: 11, color: INK_2 }}>{s.mobile ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const DesktopDesigns: React.FC<{ flow: Flow }> = ({ flow }) => {
  const bySlug = Object.fromEntries(flow.frames.map(f => [f.slug, f]))
  return (
    <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: INK, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px' }}>Desktop designs</h1>
      <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '0 0 6px', maxWidth: '80ch' }}>
        The Get started prototype is mobile-only, but desktop onboarding designs exist as library components and instances in four files. Each is the designer&rsquo;s export, with the file and its last-edit date — several predate the mobile prototype by over a year.
      </p>
      <p style={{ fontSize: 13, lineHeight: '19px', color: '#A11F24', margin: '0 0 22px', maxWidth: '80ch', paddingLeft: 10, borderLeft: '2px solid #A11F24' }}>
        The desktop model: every desktop onboarding <em>modal</em> is the library&rsquo;s <em>Modal full-window</em> shell with the same 375-wide content mobile uses inside it; once the community exists the app is the split view — the V1 desktop sidebar on the left, the chat filling the rest (decided 2026-09-12) — the library&rsquo;s <em>Join community</em> variants are 375 wide. Routes agree with mobile. <em>Register username</em> is stale cruft; desktop username takes the mobile prototype&rsquo;s content.
      </p>
      {DESKTOP.map(d => {
        const cp = d.counterpart ? bySlug[d.counterpart] : undefined
        return (
          <div key={d.slug} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', padding: '18px 0', borderTop: `1px solid ${RULE}` }}>
            <img src={dsrc(d.png)} alt={d.name} style={{ width: Math.min(d.width, 640), height: 'auto', display: 'block', border: `1px solid ${RULE}`, borderRadius: 6, background: '#fff' }} />
            <div style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_3 }}>{d.fileName} · {d.date}</div>
              <h2 style={{ fontSize: 18, lineHeight: '24px', fontWeight: 500, margin: '2px 0 4px' }}>{d.name}</h2>
              <p style={{ fontSize: 12, color: INK_3, margin: '0 0 8px' }}>{d.width}×{d.height} · node <span style={{ fontFamily: mono }}>{d.node}</span> · <a href={d.url} target="_blank" rel="noreferrer" style={{ color: '#0D6420' }}>open in Figma</a></p>
              <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '0 0 8px' }}>{d.note}</p>
              {cp ? <p style={{ fontSize: 13, margin: '0 0 8px' }}><span style={{ color: INK_3 }}>mobile counterpart: </span><button type="button" onClick={() => navigate(cp)} style={{ background: 'none', border: 0, padding: 0, color: '#0D6420', cursor: 'pointer', font: 'inherit' }}>{cp.display}</button></p> : null}
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, lineHeight: '18px', color: INK_2 }}>{d.copy.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
