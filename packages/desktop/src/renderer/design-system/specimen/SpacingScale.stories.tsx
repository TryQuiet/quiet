import React from 'react'

import { grid2px, grid4px, SEMANTIC_KEYS, Tokens } from '../tokens'
import { ACCENT, INK_3, mono, Num, Page, Section } from './ui'

const Step: React.FC<{ value: number; max: number }> = ({ value, max }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
    <Num width={34}>{value}</Num>
    <div style={{ width: `${(value / max) * 100}%`, minWidth: 2, height: 18, background: ACCENT, borderRadius: 1 }} />
  </div>
)

/** Two boxes separated by each step, so the gap is legible as a gap. */
const Gap: React.FC<{ value: number }> = ({ value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
    <Num width={34}>{value}</Num>
    <div style={{ display: 'flex', gap: value }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 40, height: 26, background: '#E9EDE1', border: `1px solid ${ACCENT}33` }} />
      ))}
    </div>
  </div>
)

const Scale: React.FC<{ tokens: Tokens }> = ({ tokens }) => {
  const max = Math.max(...tokens.space)
  return (
    <Page title={tokens.name} subtitle={`Base ${tokens.base}px · ${tokens.space.length} steps`}>
      <Section label="Steps">
        {tokens.space.map(v => (
          <Step key={v} value={v} max={max} />
        ))}
      </Section>
      <Section label="Roles — what screens actually ask for">
        {SEMANTIC_KEYS.map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 12, width: 34, color: INK_3 }}>{k}</span>
            <Num width={34}>{tokens.semantic[k]}</Num>
            <div style={{ width: tokens.semantic[k], height: 18, background: ACCENT, borderRadius: 1 }} />
          </div>
        ))}
      </Section>
      <Section label="As gaps">
        {tokens.space.map(v => (
          <Gap key={v} value={v} />
        ))}
      </Section>
      <Section label="Radii">
        <div style={{ display: 'flex', gap: 16 }}>
          {tokens.radii.map(r => (
            <div key={r} style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#E9EDE1', border: `1px solid ${ACCENT}33`, borderRadius: r }} />
              <span style={{ fontFamily: mono, fontSize: 11, color: INK_3 }}>{r}</span>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  )
}

export default {
  title: 'Foundations/Spacing Scale',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const TwoPxGrid = () => <Scale tokens={grid2px} />
export const FourPxGrid = () => <Scale tokens={grid4px} />
