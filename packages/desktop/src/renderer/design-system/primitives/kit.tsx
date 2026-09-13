import React from 'react'

import { SemanticSpace, Tokens, TypeRole } from '../tokens'

// A layout kit whose every spacing and type value resolves through a token set,
// so one screen can be rendered under two grids and honestly compared.
//
// Spacing is always asked for by ROLE (`gap="md"`), never by index into the
// scale: the 2px scale has twelve steps and the 4px scale has eight, so the same
// index means different things and would manufacture differences that have
// nothing to do with the grids.

type Gap = keyof SemanticSpace

export const Txt: React.FC<{
  tokens: Tokens
  role: TypeRole
  color?: string
  align?: 'left' | 'center'
  /** Single line, ellipsised. For values that can be arbitrarily long (invite links). */
  truncate?: boolean
  children: React.ReactNode
}> = ({ tokens, role, color, align, truncate, children }) => {
  const s = tokens.type[role]
  return (
    <span
      style={{
        fontFamily: "'Rubik', sans-serif",
        fontSize: s.fontSize,
        lineHeight: `${s.lineHeight}px`,
        fontWeight: s.fontWeight,
        color: color ?? '#171B12',
        textAlign: align ?? 'left',
        display: 'block',
        ...(truncate
          ? ({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const)
          : ({ overflowWrap: 'anywhere' } as const)),
      }}
    >
      {children}
    </span>
  )
}

export const Stack: React.FC<{
  tokens: Tokens
  gap: Gap
  align?: 'stretch' | 'center'
  children: React.ReactNode
}> = ({ tokens, gap, align = 'stretch', children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.semantic[gap],
      alignItems: align === 'center' ? 'center' : 'stretch',
      minWidth: 0,
    }}
  >
    {children}
  </div>
)

export const Field: React.FC<{ tokens: Tokens; label: string; placeholder: string; value?: string }> = ({
  tokens,
  label,
  placeholder,
  value,
}) => (
  <Stack tokens={tokens} gap="xs">
    <Txt tokens={tokens} role="body" color="#5C6353">
      {label}
    </Txt>
    <div
      style={{
        border: `1px solid ${value ? '#521C74' : '#C4C4C4'}`,
        borderRadius: tokens.radii[1],
        padding: `${tokens.semantic.sm}px ${tokens.semantic.md}px`,
        background: '#fff',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <Txt tokens={tokens} role="bodyLg" color={value ? '#171B12' : '#9AA18C'} truncate>
        {value || placeholder}
      </Txt>
    </div>
  </Stack>
)

export const Btn: React.FC<{ tokens: Tokens; children: React.ReactNode; variant?: 'primary' | 'ghost' }> = ({
  tokens,
  children,
  variant = 'primary',
}) => {
  const primary = variant === 'primary'
  return (
    <div
      style={{
        background: primary ? '#521C74' : 'transparent',
        border: primary ? 'none' : '1px solid #C4C4C4',
        borderRadius: tokens.radii[1],
        padding: `${tokens.semantic.md}px ${tokens.semantic.xl}px`,
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <Txt tokens={tokens} role="subtitle" align="center" color={primary ? '#fff' : '#171B12'}>
        {children}
      </Txt>
    </div>
  )
}

/**
 * A device frame. Mobile is 390px (iPhone 14/15 logical width); desktop is the
 * 600px modal body Quiet actually uses, not a full window.
 */
export const Frame: React.FC<{ tokens: Tokens; platform: 'desktop' | 'mobile'; children: React.ReactNode }> = ({
  tokens,
  platform,
  children,
}) => {
  const width = platform === 'mobile' ? 390 : 600
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontFamily: "'Menlo Regular', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#8A927C',
        }}
      >
        {platform} · {width}px
      </span>
      <div
        style={{
          width,
          border: '1px solid #E2E6DA',
          borderRadius: 6,
          background: '#fff',
          padding: platform === 'mobile' ? tokens.semantic.xl : tokens.semantic.xxl,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const BothPlatforms: React.FC<{
  tokens: Tokens
  render: (t: Tokens) => React.ReactNode
}> = ({ tokens, render }) => (
  <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
    <Frame tokens={tokens} platform="desktop">
      {render(tokens)}
    </Frame>
    <Frame tokens={tokens} platform="mobile">
      {render(tokens)}
    </Frame>
  </div>
)
