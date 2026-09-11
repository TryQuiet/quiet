import React from 'react'

import { BothPlatforms, Btn, Field, Stack, Txt } from '../primitives/kit'
import { grid2px, grid4px, Tokens } from '../tokens'
import { INK_3, mono, RULE } from '../specimen/ui'

// Screens mirror the named frames in the Figma file "Get started (prototype)"
// (key f6Nr5b5wtvk6Xoh1HJZ8Dd, last modified 2026-04-14) — the newest file in
// the account and the only onboarding file whose frames are actually named.
// Copy is taken from the real app where it exists:
//   packages/desktop/src/renderer/components/CreateJoinCommunity/community.dictionary.tsx
const FIGMA = 'https://www.figma.com/design/f6Nr5b5wtvk6Xoh1HJZ8Dd/Get-started--prototype-'

const GetStarted = (t: Tokens) => (
  <Stack tokens={t} gap="xl">
    <Stack tokens={t} gap="sm">
      <Txt tokens={t} role="h3">
        Get started
      </Txt>
      <Txt tokens={t} role="body" color="#5C6353">
        Quiet is a private messenger with no servers to trust. Join a community you were invited to, or start one for
        the people you already talk to.
      </Txt>
    </Stack>
    <Stack tokens={t} gap="sm">
      <Btn tokens={t}>Join a community</Btn>
      <Btn tokens={t} variant="ghost">
        Create a new community
      </Btn>
    </Stack>
  </Stack>
)

const JoinCommunity = (t: Tokens) => (
  <Stack tokens={t} gap="xl">
    <Txt tokens={t} role="h3">
      Join community
    </Txt>
    <Field
      tokens={t}
      label="Paste your invite link to join an existing community"
      placeholder="Invite link"
      value="https://tryquiet.org/join#Wz8iMTA5LjIwMS4xNTIuMjIiLCJyM2FkOG5xbHZ4ZjJ0OGN3In0kZXhhbXBsZQ"
    />
    <Stack tokens={t} gap="md">
      <Btn tokens={t}>Continue</Btn>
      <Txt tokens={t} role="caption" align="center" color="#521C74">
        You can also create a new community
      </Txt>
    </Stack>
  </Stack>
)

const CreateCommunity = (t: Tokens) => (
  <Stack tokens={t} gap="xl">
    <Txt tokens={t} role="h3">
      Create your community
    </Txt>
    <Field tokens={t} label="Community name" placeholder="Community name" value="tenth-street" />
    <Stack tokens={t} gap="md">
      <Btn tokens={t}>Continue</Btn>
      <Txt tokens={t} role="caption" align="center" color="#521C74">
        You can also join a community
      </Txt>
    </Stack>
  </Stack>
)

const Username = (t: Tokens) => (
  <Stack tokens={t} gap="xl">
    <Stack tokens={t} gap="sm">
      <Txt tokens={t} role="h3">
        Register a username
      </Txt>
      <Txt tokens={t} role="body" color="#5C6353">
        Your username is how people will know you in this community.
      </Txt>
    </Stack>
    <Field tokens={t} label="Enter a username" placeholder="Username" value="Holmes W" />
    <Stack tokens={t} gap="xs">
      <Txt tokens={t} role="caption" color="#8A5F09">
        Your username will be registered as @holmes-w
      </Txt>
    </Stack>
    <Btn tokens={t}>Continue</Btn>
  </Stack>
)

const LinkDevices = (t: Tokens) => (
  <Stack tokens={t} gap="xl">
    <Stack tokens={t} gap="sm">
      <Txt tokens={t} role="h3">
        Link a device
      </Txt>
      <Txt tokens={t} role="body" color="#5C6353">
        Open Quiet on your other device and enter this code. Both devices need to stay online until linking finishes.
      </Txt>
    </Stack>
    <div
      style={{
        border: `1px dashed ${RULE}`,
        borderRadius: t.radii[1],
        padding: t.semantic.xl,
        textAlign: 'center',
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 28, letterSpacing: '0.2em', color: '#171B12' }}>4K7M-92QP</span>
    </div>
    <Btn tokens={t} variant="ghost">
      Show QR code instead
    </Btn>
  </Stack>
)

const SCREENS: Record<string, (t: Tokens) => React.ReactNode> = {
  'Get started': GetStarted,
  'Join community': JoinCommunity,
  'Create your community': CreateCommunity,
  'Register a username': Username,
  'Link a device': LinkDevices,
}

const Compare: React.FC<{ name: keyof typeof SCREENS; note?: string }> = ({ name, note }) => {
  const render = SCREENS[name]
  return (
    <div style={{ padding: 32, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
      <h1 style={{ fontSize: 28, lineHeight: '36px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        {name}
      </h1>
      <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 4px' }}>
        Same screen under both grids, at both widths. Everything below is driven by the token set — no hardcoded padding.
      </p>
      <p style={{ fontSize: 12, color: INK_3, margin: '0 0 28px' }}>
        Figma:{' '}
        <a href={FIGMA} target="_blank" rel="noreferrer" style={{ color: '#0D6420' }}>
          Get started (prototype)
        </a>
        {note ? ` · ${note}` : ''}
      </p>

      {[grid2px, grid4px].map(t => (
        <div key={t.name} style={{ marginBottom: 40 }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#0D6420',
              borderTop: `2px solid #0D6420`,
              paddingTop: 8,
              marginBottom: 16,
            }}
          >
            {t.name} · xs {t.semantic.xs} · sm {t.semantic.sm} · md {t.semantic.md} · lg {t.semantic.lg} · xl {t.semantic.xl} · xxl {t.semantic.xxl}
          </div>
          <BothPlatforms tokens={t} render={(tok: Tokens) => render(tok)} />
        </div>
      ))}
    </div>
  )
}

export default {
  title: 'Screens/Onboarding',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const GetStartedScreen = () => <Compare name="Get started" />
export const JoinCommunityScreen = () => <Compare name="Join community" />
export const CreateCommunityScreen = () => <Compare name="Create your community" />
export const UsernameScreen = () => <Compare name="Register a username" />
export const LinkDevicesScreen = () => (
  <Compare
    name="Link a device"
    note="design mock only — PR #3400 adds the sagas, no screens yet, and neither package has device-linking UI on this branch"
  />
)
