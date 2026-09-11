import React from 'react'

// Presentational helpers for the specimen stories. Plain inline styles rather
// than MUI on purpose: a spacing and type specimen has to show exactly the
// values it names, with nothing inherited in between.

export const INK = '#171B12'
export const INK_2 = '#5C6353'
export const INK_3 = '#8A927C'
export const RULE = '#E2E6DA'
export const ACCENT = '#0D6420'

export const mono = "'Menlo Regular', ui-monospace, SFMono-Regular, Menlo, monospace"

export const Page: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <div style={{ padding: 32, maxWidth: 900, color: INK, fontFamily: "'Rubik', sans-serif" }}>
    <h1 style={{ fontSize: 28, lineHeight: '36px', fontWeight: 500, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
      {title}
    </h1>
    {subtitle ? <p style={{ fontSize: 14, lineHeight: '20px', color: INK_2, margin: '0 0 28px' }}>{subtitle}</p> : null}
    {children}
  </div>
)

export const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <section style={{ marginBottom: 36 }}>
    <h2
      style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: INK_3,
        margin: '0 0 12px',
      }}
    >
      {label}
    </h2>
    {children}
  </section>
)

export const Num: React.FC<{ children: React.ReactNode; color?: string; width?: number }> = ({
  children,
  color,
  width,
}) => (
  <span style={{ fontFamily: mono, fontSize: 12, color: color ?? INK, width, display: 'inline-block' }}>{children}</span>
)
