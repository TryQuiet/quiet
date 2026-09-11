import React from 'react'

import { current, grid2px, grid4px, MUI_VARIANT, Tokens, TYPE_ROLES, TypeStyle } from '../tokens'
import { ACCENT, INK, INK_3, mono, Page, RULE, Section } from './ui'

const SPECIMEN = 'Join a community you were invited to, or create a new one for the people you already talk to.'

const same = (a: TypeStyle, b: TypeStyle) =>
  a.fontSize === b.fontSize && a.lineHeight === b.lineHeight && a.fontWeight === b.fontWeight

const fmt = (s: TypeStyle) => `${s.fontSize}/${s.lineHeight} w${s.fontWeight}`

// Both columns in the same ink on purpose: this sheet compares size and leading,
// and a colour difference reads as a weight difference that is not there.
const Spec: React.FC<{ style: TypeStyle }> = ({ style }) => (
  <p
    style={{
      fontFamily: "'Rubik', sans-serif",
      fontSize: style.fontSize,
      lineHeight: `${style.lineHeight}px`,
      fontWeight: style.fontWeight,
      color: INK,
      margin: 0,
      maxWidth: 460,
    }}
  >
    {SPECIMEN}
  </p>
)

const TypeSheet: React.FC<{ tokens: Tokens }> = ({ tokens }) => (
  <Page title={`Type scale — ${tokens.name}`} subtitle="Current values on the left, this scale on the right.">
    <Section label="Roles">
      {TYPE_ROLES.map(role => {
        const before = current.type[role]
        const after = tokens.type[role]
        const changed = !same(before, after)
        return (
          <div key={role} style={{ borderTop: `1px solid ${RULE}`, padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{role}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: INK_3 }}>MUI: {MUI_VARIANT[role]}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, color: INK_3, marginBottom: 8 }}>current · {fmt(before)}</div>
                <Spec style={before} />
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, color: changed ? ACCENT : INK_3, marginBottom: 8 }}>
                  {tokens.name} · {fmt(after)}
                </div>
                <Spec style={after} />
              </div>
            </div>
          </div>
        )
      })}
    </Section>
  </Page>
)

export default {
  title: 'Foundations/Type Scale',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const TwoPxGrid = () => <TypeSheet tokens={grid2px} />
export const FourPxGrid = () => <TypeSheet tokens={grid4px} />
