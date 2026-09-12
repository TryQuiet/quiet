import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { createGridTheme } from '../theme/gridTheme'
import { tokens, Tokens } from '../tokens'
import { INK_3, mono, RULE } from '../specimen/ui'

// Existing components, driven from the stories that already exist in this repo,
// rendered under the design system's tokens. Nothing here is a recreation.
import * as ChannelStories from '../../components/Channel/Channel.stories'
import * as SidebarStories from '../../components/Sidebar/Sidebar.stories'
import * as ChannelInputStories from '../../components/widgets/channels/ChannelInput/ChannelInput.stories'

type StoryFn = ((args: Record<string, unknown>) => JSX.Element) & { args?: Record<string, unknown> }

const Panel: React.FC<{ tokens: Tokens; width: number; height?: number; children: React.ReactNode }> = ({
  tokens,
  width,
  height,
  children,
}) => {
  const isCurrent = false
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
      <div style={{ border: `1px solid ${RULE}`, background: '#fff', overflow: height ? 'auto' : 'hidden', height }}>
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
  /** Bound the panel so a 100vh component scrolls inside it rather than scrolling the story. */
  height?: number
  note?: string
  render: () => React.ReactNode
}> = ({ title, source, width = 620, height, note, render }) => (
  <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
    <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
      {title}
    </h1>
    <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 4px' }}>
      The existing component, rendered from <span style={{ fontFamily: mono }}>{source}</span> with that story&rsquo;s own
      args, under the design system&rsquo;s tokens.
    </p>
    {note ? <p style={{ fontSize: 13, color: '#8A5F09', margin: '0 0 16px' }}>{note}</p> : null}
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
      <Panel tokens={tokens} width={width} height={height}>
        {render()}
      </Panel>
    </div>
    <p style={{ fontSize: 12, lineHeight: '18px', color: INK_3, marginTop: 20, maxWidth: '70ch' }}>
      The theme carries the type scale; this component still hardcodes its own font sizes and spacing in places (39
      desktop component files do), so what you see here is where it stands before migration. Migrating it onto the
      tokens is the work.
    </p>
  </div>
)

const renderStory = (s: StoryFn) => s(s.args ?? {})

export default {
  title: 'Components/Existing',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const ChannelView = () => (
  <Compare
    title="Channel"
    source="Components/Channel → Normal"
    width={680}
    height={720}
    note="TextMessage.tsx and BasicMessage.tsx hardcode fontSize '0.855rem' / lineHeight '21px' / 14, 16, 21 and use no theme variants — the message list is first on the migration list."
    render={() => renderStory(ChannelStories.Normal as unknown as StoryFn)}
  />
)

export const Sidebar = () => (
  <Compare
    title="Sidebar"
    source="Components/SidebarComponent → Reusable"
    width={320}
    note="Channel rows are 14px at weight 300 with hardcoded 3px vertical padding — to migrate onto the tokens."
    render={() => (
      <div style={{ height: 620, display: 'flex', alignItems: 'stretch' }}>
        {renderStory(SidebarStories.Reusable as unknown as StoryFn)}
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
