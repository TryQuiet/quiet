import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { createGridTheme } from '../theme/gridTheme'
import { current, grid4px, Tokens } from '../tokens'
import { INK_3, mono, RULE } from '../specimen/ui'

// Real components, driven from the stories that already exist in this repo.
// Nothing here is a recreation: each panel renders the same component with the
// same args the existing story uses, only under a different theme.
import * as ChannelStories from '../../components/Channel/Channel.stories'
import * as SidebarStories from '../../components/Sidebar/Sidebar.stories'
import * as ChannelInputStories from '../../components/widgets/channels/ChannelInput/ChannelInput.stories'

type StoryFn = ((args: Record<string, unknown>) => JSX.Element) & { args?: Record<string, unknown> }

const Panel: React.FC<{ tokens: Tokens; width: number; children: React.ReactNode }> = ({ tokens, width, children }) => {
  const isCurrent = tokens === current
  return (
    <div style={{ flex: `0 0 ${width}px`, minWidth: 0 }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isCurrent ? INK_3 : '#0D6420',
          borderTop: `2px solid ${isCurrent ? RULE : '#0D6420'}`,
          paddingTop: 8,
          marginBottom: 12,
        }}
      >
        {isCurrent ? 'ships today' : tokens.name} · body {tokens.type.body.fontSize}/{tokens.type.body.lineHeight} ·
        caption {tokens.type.caption.fontSize}/{tokens.type.caption.lineHeight}
      </div>
      <div style={{ border: `1px solid ${RULE}`, background: '#fff', overflow: 'hidden' }}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={createGridTheme(tokens)}>{children}</ThemeProvider>
        </StyledEngineProvider>
      </div>
    </div>
  )
}

const Compare: React.FC<{
  title: string
  source: string
  width?: number
  note?: string
  render: () => React.ReactNode
}> = ({ title, source, width = 620, note, render }) => (
  <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
    <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
      {title}
    </h1>
    <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 4px' }}>
      The real component, rendered from <span style={{ fontFamily: mono }}>{source}</span> with that story&rsquo;s own
      args. Left is the theme that ships today; right swaps in the 4px type scale.
    </p>
    {note ? <p style={{ fontSize: 13, color: '#8A5F09', margin: '0 0 16px' }}>{note}</p> : null}
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
      <Panel tokens={current} width={width}>
        {render()}
      </Panel>
      <Panel tokens={grid4px} width={width}>
        {render()}
      </Panel>
    </div>
    <p style={{ fontSize: 12, lineHeight: '18px', color: INK_3, marginTop: 20, maxWidth: '70ch' }}>
      <strong>Read the near-identical panels as the finding, not as a failure.</strong> Repo-wide, 51 component files
      use a theme typography variant and 39 hardcode <span style={{ fontFamily: mono }}>fontSize</span> — so a theme-level
      type change reaches only part of the app, and misses the densest parts. Adopting a scale means editing components,
      not swapping a theme.{' '}
      Only typography differs between the two panels. The spacing factor is left alone on purpose: about 55% of
      component files hardcode px literals that no theme can reach, and the ~40{' '}
      <span style={{ fontFamily: mono }}>theme.spacing(n)</span> call sites were written expecting n×8, so changing the
      factor would halve or double them rather than snap them to a grid. Spacing has to be migrated in the components
      themselves.
    </p>
  </div>
)

const renderStory = (s: StoryFn) => s(s.args ?? {})

export default {
  title: 'Screens/Real components',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const ChannelView = () => (
  <Compare
    title="Channel"
    source="Components/Channel → Normal"
    width={680}
    note="Expected the densest surface to show the biggest change. It shows almost none — TextMessage.tsx and BasicMessage.tsx use no theme typography variants at all, hardcoding fontSize: '0.855rem' / lineHeight: '21px' / fontSize 14, 16, 21. The message list cannot be restyled from the theme."
    render={() => renderStory(ChannelStories.Normal as unknown as StoryFn)}
  />
)

export const Sidebar = () => (
  <Compare
    title="Sidebar"
    source="Components/SidebarComponent → Reusable"
    width={320}
    note="Channel rows are 14px at weight 300 with hardcoded 3px vertical padding — a good test of whether type alone changes the rhythm."
    render={() => (
      <div style={{ height: 620, display: 'flex', alignItems: 'stretch' }}>
        <SidebarStories.Reusable {...({} as never)} />
      </div>
    )}
  />
)

export const ChannelInput = () => (
  <Compare
    title="Channel input"
    source="Components/ChannelInput → Component"
    width={560}
    render={() => renderStory(ChannelInputStories.Component as unknown as StoryFn)}
  />
)

// Deliberately omitted: CreateUsername and JoinCommunity. Both render through
// MUI's Modal, which portals to document.body - so each panel's modal escapes its
// container and the two overlay each other instead of sitting side by side.
// Comparing modals needs a different harness (disablePortal, or one theme per
// story rather than two per page).
