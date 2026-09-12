import React from 'react'

import { MUI_VARIANT, tokens, Tokens, TYPE_ROLES, TypeStyle } from '../tokens'
import { INK, INK_3, mono, Page, RULE, Section } from './ui'

const SPECIMEN = 'Join a community you were invited to, or create a new one for the people you already talk to.'
const fmt = (s: TypeStyle) => `${s.fontSize}/${s.lineHeight} w${s.fontWeight}`

const Spec: React.FC<{ style: TypeStyle }> = ({ style }) => (
  <p
    style={{
      fontFamily: "'Rubik', sans-serif",
      fontSize: style.fontSize,
      lineHeight: `${style.lineHeight}px`,
      fontWeight: style.fontWeight,
      color: INK,
      margin: 0,
      maxWidth: 560,
    }}
  >
    {SPECIMEN}
  </p>
)

const TypeSheet: React.FC<{ tokens: Tokens }> = ({ tokens }) => (
  <Page title="Type" subtitle="Rubik, weights 400 and 500 only (the two that are bundled). Line-heights sit on the 4px grid.">
    <Section label="Roles">
      {TYPE_ROLES.map(role => (
        <div key={role} style={{ borderTop: `1px solid ${RULE}`, padding: '18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{role}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: INK_3 }}>{fmt(tokens.type[role])} · MUI {MUI_VARIANT[role]}</span>
          </div>
          <Spec style={tokens.type[role]} />
        </div>
      ))}
    </Section>
  </Page>
)

export default {
  title: 'Foundations/Type',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const Scale = () => <TypeSheet tokens={tokens} />
