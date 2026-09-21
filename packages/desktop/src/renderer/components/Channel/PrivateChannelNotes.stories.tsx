import React from 'react'
import { ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

/**
 * Where the private-channel implementation departs from the Figma designs, and why.
 *
 * Written as a story rather than MDX: `@storybook/addon-docs` is only present nested under
 * addon-essentials here, so a `.stories.mdx` page cannot resolve its `Meta` import without either
 * adding a dependency or aliasing a hoisting-dependent path.
 */
const DESIGNS: [string, string][] = [
  ['Create channels for specific roles', 'PVQ1Kjf6Cq8ng1czuVtvR8 — the flow'],
  ['Quiet Design Library', '0j7Nna9zWmfOSNmRmQK1Uh — components'],
  ['Direct Messages', 'tXuRsUfP6VnSv99dox00C1 — recipient pills'],
]

const ROLE_DEPARTURES: [string, string][] = [
  [
    'Menu row "Permissions", subtitle "Roles and members", count 6',
    'One "Members in this channel" row with the member count',
  ],
  ['Panel title "Permissions"', '"Members in this channel"'],
  ['"Add members or roles"', '"Add members"'],
  ['ROLES section in the picker', 'absent'],
]

const PLATFORM_DIFFS: [string, string, string, string][] = [
  ['Channel header count — desktop 838:9769', '#7F7F7F', '14/20', '0'],
  ['Channel header count — mobile 838:9711', '#000000', '12/14.2', '0.4'],
]

const SPECS: [string, string][] = [
  [
    'Button (3505:10206)',
    'Radius 16 throughout. Large 50 tall, 20/12 padding, 16 label; Small 32, 12/6, 14. Primary #521C74 → #461863; Secondary white inside #B3B3B3 → #F7F7F7; Destructive #D13135 → #BA272B; disabled is the same button at 30%.',
  ],
  [
    'Field (Input 2.0 base)',
    'Radius 16, 48 tall, 16 padding, #B3B3B3 hairline. Its states are undefined, so focus/error/disabled come from Input3.0 (5077:43258): #1B6FEC, #D13135, and #F0F0F0 inside #E5E5E5.',
  ],
  ['Panel row (2989:185)', '48 tall, 64 with a subtitle, 16/11 padding, 16 gap, #F0F0F0 on hover.'],
  [
    'Panel header (3606:13240)',
    '60 tall, 64 with a subtitle, 28 glyph at a 14 inset, title centred on the full width at 16/26 weight 500.',
  ],
  [
    'Pill (919:47856)',
    '26 tall, radius 8, 8/1 padding, #F7F7F7 → #F0F0F0 on hover, ✕ #A1A1A1 → #4C4C4C when the ✕ itself is hovered. The thumbnail is always drawn; Jdenticon stands in. Gap between pills is 4 in the add-members box (838:9308) and 10 in the DM recipient field (919:48416).',
  ],
  ['Toggle', '#80B857 on, #F0F0F0 inside #E5E5E5 off.'],
  ['Destructive red', '#D13135 — not the #E42656 validation pink.'],
]

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 840, fontFamily: 'Rubik, sans-serif', lineHeight: 1.6, color: '#222' },
  h2: { fontSize: 20, fontWeight: 500, marginTop: 36, marginBottom: 8 },
  p: { fontSize: 14, margin: '8px 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '12px 0' },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #F0F0F0', color: '#7F7F7F', fontWeight: 500 },
  td: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #F0F0F0', verticalAlign: 'top' },
  code: { background: '#F7F7F7', padding: '1px 5px', borderRadius: 4, fontFamily: 'Menlo, monospace', fontSize: 12 },
}

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={styles.code}>{children}</span>

export const Notes = () => (
  <div style={styles.page}>
    <h1 style={{ fontSize: 28, fontWeight: 500 }}>Private channels — notes</h1>
    <p style={styles.p}>
      Where this implementation departs from the designs, and why. Every departure is deliberate and names the trigger
      that should reverse it.
    </p>
    <table style={styles.table}>
      <tbody>
        {DESIGNS.map(([name, key]) => (
          <tr key={name}>
            <td style={styles.td}>{name}</td>
            <td style={styles.td}>
              <Code>{key}</Code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2 style={styles.h2}>Roles do not exist yet</h2>
    <p style={styles.p}>
      The designs were drawn for a product with roles. Ours has only members, so anywhere the design says “roles” the
      word is dropped rather than half-translated. Restore each of these when roles ship.
    </p>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Design</th>
          <th style={styles.th}>Here</th>
        </tr>
      </thead>
      <tbody>
        {ROLE_DEPARTURES.map(([design, here]) => (
          <tr key={design}>
            <td style={styles.td}>{design}</td>
            <td style={styles.td}>{here}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p style={styles.p}>
      The design shows Members <em>and</em> Permissions as two rows because their counts differ — 3 people against 6
      roles-and-members. With no roles the two would show the same number, so one is a duplicate.{' '}
      <strong>Channel menu / As designed</strong> holds the design’s version.
    </p>
    <p style={styles.p}>
      Naming follows what the screen does. “Permissions” promises governance the screen does not yet have; it lists
      people and adds people. Whether you may add is shown by the <strong>Add members</strong> button, not by the title
      — which also stops the row renaming itself depending on who is looking.
    </p>

    <h2 style={styles.h2}>Members or Permissions is an admin question, not a privacy one</h2>
    <p style={styles.p}>
      Which form of the screen you get turns on admin status, never on whether the channel is private. A public channel
      has no per-channel permissions in state at all — <Code>currentChannelPermissions</Code> returns undefined for one
      and <Code>GenericChannelPermissions.public</Code> carries only create and delete — so nobody reads as a public
      channel’s admin and everyone gets the read-only form there. Changing that needs the state manager, not the UI.
    </p>
    <p style={styles.p}>
      A public channel’s member list <em>is</em> resolvable: a profile carries only the private channels it belongs to,
      because everyone in the community is in every public one. Note <Code>UserProfile.channels</Code> is derived from{' '}
      <Code>users.users[userId].channelIds</Code>, so seeding <Code>channels</Code> on a fixture is silently ignored —
      seed through <Code>users.actions.setUsers</Code> instead.
    </p>

    <h2 style={styles.h2}>Two variants of Add members, one unreachable</h2>
    <p style={styles.p}>
      The design draws this screen twice: from the channel menu (<Code>838:9305</Code>) with ✕ and Done and no bottom
      button, and during create-channel (<Code>838:9477</Code>) with a back arrow, no Done, and a Create channel button.
      Only the first is reachable — creating a channel dispatches <Code>setCurrentChannel</Code> then{' '}
      <Code>replaceScreen(ChannelScreen)</Code> and goes straight into the new channel. Building the second means
      deferring creation until after the members step.
    </p>

    <h2 style={styles.h2}>Not built, not faked</h2>
    <p style={styles.p}>
      <strong>Disappearing messages</strong>, <strong>Auto-delete channel</strong> and <strong>Notifications</strong>{' '}
      are in the channel menu design and absent here — no state-manager support. The channel header’s subtitle shows the
      member count only, for the same reason. <strong>Removing</strong> a member is in the design’s Permissions panel;
      the state manager has <Code>addMembersChannel</Code> and no remove, so rows have no ✕. There is no story for a
      user who may create channels but not private ones: creating channels is a single permission, so that combination
      is not a state the product will have.
    </p>

    <h2 style={styles.h2}>Where the design differs between platforms</h2>
    <p style={styles.p}>
      Not every difference is a mistake. The header’s member count is specified differently on each.
    </p>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Surface</th>
          <th style={styles.th}>Colour</th>
          <th style={styles.th}>Size</th>
          <th style={styles.th}>Tracking</th>
        </tr>
      </thead>
      <tbody>
        {PLATFORM_DIFFS.map(([surface, colour, size, tracking]) => (
          <tr key={surface}>
            <td style={styles.td}>{surface}</td>
            <td style={styles.td}>
              <Code>{colour}</Code>
            </td>
            <td style={styles.td}>{size}</td>
            <td style={styles.td}>{tracking}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2 style={styles.h2}>Specs worth not re-deriving</h2>
    <table style={styles.table}>
      <tbody>
        {SPECS.map(([name, spec]) => (
          <tr key={name}>
            <td style={{ ...styles.td, whiteSpace: 'nowrap', fontWeight: 500 }}>{name}</td>
            <td style={styles.td}>{spec}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2 style={styles.h2}>Dismissal</h2>
    <p style={styles.p}>
      A <strong>back arrow</strong> leaves without committing; a <strong>✕ with a Done</strong> is a task you confirm or
      cancel. Create-channel has the first, Add members the second. Settings keeps a ✕ only because it has no design of
      its own saying otherwise.
    </p>
  </div>
)

const component: ComponentMeta<typeof Notes> = {
  title: 'Private channels/Notes',
  decorators: [withTheme],
  parameters: { layout: 'fullscreen' },
}

export default component
