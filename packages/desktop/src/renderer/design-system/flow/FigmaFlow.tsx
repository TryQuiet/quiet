import React, { useState } from 'react'
import { linkTo } from '@storybook/addon-links'

import { IMPLEMENTATION, IMPLEMENTATION_ONLY, Impl } from './implementation'
import { INK, INK_2, INK_3, mono, RULE } from '../specimen/ui'

export type LinkKind = 'prototype' | 'added' | 'back'
export interface FlowLink { x: number; y: number; w: number; h: number; label: string; target: string | null; kind: LinkKind; note?: string }
export interface FlowFrame {
  slug: string; name: string; display: string; node: string
  /** Story id, derived from the export name by gen.cjs and verified with @storybook/csf. */
  id: string
  section: string
  width: number; height: number; png: string; url: string; note?: string | null; links: FlowLink[]
}
export interface Flow { file: string; start: string; sections: string[]; mapId?: string; frames: FlowFrame[] }

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

export const Stage: React.FC<{ flow: Flow; frame: FlowFrame }> = ({ flow, frame }) => {
  const [outline, setOutline] = useState(true)
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

  return (
    <div style={{ display: 'flex', gap: 32, padding: 24, alignItems: 'flex-start', fontFamily: "'Rubik', sans-serif", color: INK, flexWrap: 'wrap' }}>
      <div>
        <div style={{ position: 'relative', width: frame.width, height: frame.height, border: `1px solid ${RULE}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
          <img src={src(frame.png)} width={frame.width} height={frame.height} alt={frame.name} style={{ display: 'block' }} />
          {frame.links.map((l, i) => {
            const st = KIND_STYLE[l.kind]
            return (
              <button
                key={i}
                type="button"
                data-kind={l.kind}
                title={`${l.label} → ${describe(l)} · ${st.word}`}
                aria-label={`${l.label}: ${l.kind === 'back' ? 'go back' : 'go to ' + describe(l)} (${st.word})`}
                onClick={() => follow(l)}
                style={{ position: 'absolute', left: l.x, top: l.y, width: l.w, height: l.h, background: outline ? st.bg : 'transparent', border: outline ? st.border : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              />
            )
          })}
        </div>
        <label style={{ display: 'block', marginTop: 8, fontSize: 12, color: INK_3 }}>
          <input type="checkbox" checked={outline} onChange={e => setOutline(e.target.checked)} /> show link targets
        </label>
        <div style={{ fontSize: 11, color: INK_3, marginTop: 4, lineHeight: '16px' }}>
          <span style={{ color: KIND_INK.prototype }}>green dashed</span> = wired in the Figma prototype ·{' '}
          <span style={{ color: KIND_INK.added }}>amber solid</span> = added for this review ·{' '}
          <span style={{ color: KIND_INK.back }}>blue dotted</span> = drawn back/close, not wired; goes back
        </div>
      </div>

      <div style={{ maxWidth: 420, minWidth: 280, flex: 1 }}>
        <Eyebrow top={0}>stage</Eyebrow>
        <h1 style={{ fontSize: 22, lineHeight: '28px', fontWeight: 500, margin: '2px 0 4px', letterSpacing: '-0.01em' }}>{frame.display}</h1>
        <p style={{ fontSize: 12, color: INK_3, margin: '0 0 6px' }}>
          {frame.width}×{frame.height} · node <span style={{ fontFamily: mono }}>{frame.node}</span> ·{' '}
          <a href={frame.url} target="_blank" rel="noreferrer" style={{ color: '#0D6420' }}>open in Figma</a>
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
      {flow.frames.length} screens in file <span style={{ fontFamily: mono }}>{flow.file}</span>, in {flow.sections.length} clusters the prototype does not connect. Click any stage to open it; the frame&rsquo;s buttons then walk the flow.
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

/**
 * The only desktop onboarding design in the account: a storyboard in
 * "Join from invite link + prototype" (dSEZJr9crJjcV3ILogea9C, last edited 2025-02-04).
 * Its screens are pictures pasted onto the board, not frames, so nothing in it can be
 * wired. The Get started prototype (2026-04) is mobile-only: every frame is 375 wide.
 */
export const DesktopDesigns: React.FC<{ flow: Flow }> = ({ flow }) => {
  const bySlug = Object.fromEntries(flow.frames.map(f => [f.slug, f]))
  return (
    <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: INK, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px' }}>Desktop designs</h1>
      <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '0 0 6px', maxWidth: '80ch' }}>
        The Get started prototype is mobile-only, but desktop onboarding designs exist as library components and instances in four files. Each is the designer&rsquo;s export, with the file and its last-edit date — several predate the mobile prototype by over a year.
      </p>
      <p style={{ fontSize: 13, lineHeight: '19px', color: '#A11F24', margin: '0 0 22px', maxWidth: '80ch', paddingLeft: 10, borderLeft: '2px solid #A11F24' }}>
        Desktop and mobile agree on routes. The library&rsquo;s <em>Join community</em> (2025-04) is the join sub-flow in two states — post-invite (<em>Create new account / Recover account</em>) and the three-way choice (<em>invite link / QR code / recover</em>), the same three as mobile. The only desktop app entry is the Dec-2024 <em>Modal full-window</em> (<em>Join / Create / Link devices</em>), a year older than the mobile prototype but the same routes.
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

export const DesktopStoryboard: React.FC = () => (
  <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: INK }}>
    <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px' }}>Desktop — the only design that exists</h1>
    <p style={{ fontSize: 13, lineHeight: '19px', color: INK_2, margin: '0 0 4px', maxWidth: '78ch' }}>
      &ldquo;Invitee clicks invite link on desktop&rdquo; from <span style={{ fontFamily: mono }}>Join from invite link + prototype</span>, last edited 2025-02-04 — a year older than the mobile prototype. Its screens are pictures pasted onto the board, not frames, so it cannot be wired or exported per screen.
    </p>
    <p style={{ fontSize: 13, lineHeight: '19px', color: '#A11F24', margin: '0 0 16px', maxWidth: '78ch', paddingLeft: 10, borderLeft: '2px solid #A11F24' }}>
      The Get started prototype has no desktop frames at all. Responsive behaviour therefore cannot come from these designs; it comes from implementing the stages on the token system and rendering them at both widths — which is what the &ldquo;Real components&rdquo; stories already do for shipped components.
    </p>
    <img src={src('invite-desktop.png')} alt="Desktop invite-link storyboard, February 2025" style={{ width: '100%', height: 'auto', display: 'block', border: `1px solid ${RULE}`, borderRadius: 6 }} />
  </div>
)
