import React from 'react'
import { ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { GetStartedComponent } from './GetStartedComponent'
import { JoinCommunityOptionsComponent } from './JoinCommunityOptionsComponent'
import { OpenInviteLinkComponent } from './OpenInviteLinkComponent'
import { PasteLinkComponent } from './PasteLinkComponent'
import { CreateCommunityComponent } from './CreateCommunityComponent'
import { LinkDevicesComponent } from './LinkDevicesComponent'
import { ActionRow } from './ActionRow'
import { TextLink } from './OpenInviteLinkComponent'
import { onboardingIcons } from './icons'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { IconButton } from '../ui/Icon/IconButton'
import { FORCE_STATE } from '../ui/interactionStates'
import BackIcon from '@mui/icons-material/ArrowBack'
import ClearIcon from '@mui/icons-material/Clear'

import { createLogger } from '../../logger'

const logger = createLogger('onboarding:stories')

const noop = () => {}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ width: 600 }}>{children}</div>

export const GetStarted = () => (
  <Body>
    <GetStartedComponent onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />
  </Body>
)

export const JoinCommunityOptions = () => (
  <Body>
    <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} />
  </Body>
)

export const OpenInviteLink = () => (
  <Body>
    <OpenInviteLinkComponent onPasteLink={noop} />
  </Body>
)

export const PasteLink = () => (
  <Body>
    <PasteLinkComponent
      heading={'Paste a link to Join'}
      handleCommunityAction={data => logger.info('Joining community', data)}
      handleClickInputReveal={noop}
    />
  </Body>
)

export const CreateCommunity = () => (
  <Body>
    <CreateCommunityComponent handleCommunityAction={name => logger.info('Creating community', name)} />
  </Body>
)

export const LinkDevices = () => (
  <Body>
    <LinkDevicesComponent direction='receive' onScanQrCode={noop} onPasteLink={noop} />
  </Body>
)

// Interaction states. Each cell wraps the real control in one of the
// FORCE_STATE classes, which the components' own state rules also match, so
// the story shows hover / pressed / focus-visible without a pointer; the last
// column is the control's real `disabled` prop.
const STATE_COLUMNS: { label: string; className?: string; disabled?: boolean }[] = [
  { label: 'default' },
  { label: 'hover', className: FORCE_STATE.hover },
  { label: 'pressed', className: FORCE_STATE.active },
  { label: 'focus-visible', className: FORCE_STATE.focus },
  { label: 'disabled', disabled: true },
]

const CONTROLS: { label: string; render: (disabled: boolean) => React.ReactNode }[] = [
  {
    label: 'Row (ActionRow)',
    render: disabled => (
      <ActionRow icon={onboardingIcons.personAdd} label={'Join a community'} onClick={noop} disabled={disabled} />
    ),
  },
  {
    label: 'Primary button (LoadingButton)',
    render: disabled => (
      <LoadingButton variant='contained' size='small' color='primary' text={'Continue'} disabled={disabled} />
    ),
  },
  {
    label: 'Text link',
    render: disabled => (
      <TextLink type='button' onClick={noop} disabled={disabled}>
        Paste a link
      </TextLink>
    ),
  },
  {
    label: 'Title-bar glyphs (IconButton)',
    // The title-bar glyphs have no disabled prop in the app, so that column stays empty.
    render: disabled =>
      disabled ? (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#7F7F7F' }}>n/a</span>
      ) : (
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <IconButton onClick={noop}>
            <BackIcon />
          </IconButton>
          <IconButton onClick={noop}>
            <ClearIcon />
          </IconButton>
        </span>
      ),
  },
]

const cell: React.CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #F0F0F0',
  verticalAlign: 'middle',
  width: 190,
}
const head: React.CSSProperties = {
  ...cell,
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#7F7F7F',
  textAlign: 'left',
}

export const InteractionStates = () => (
  <table style={{ borderCollapse: 'collapse', fontFamily: "'Rubik', sans-serif" }} data-testid='interaction-states'>
    <thead>
      <tr>
        <th style={head}>control</th>
        {STATE_COLUMNS.map(column => (
          <th key={column.label} style={head}>
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {CONTROLS.map(control => (
        <tr key={control.label}>
          <td style={{ ...cell, fontSize: 13 }}>{control.label}</td>
          {STATE_COLUMNS.map(column => (
            <td key={column.label} style={cell}>
              <div className={column.className} data-state={column.label}>
                {control.render(column.disabled === true)}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

const component: ComponentMeta<typeof GetStartedComponent> = {
  title: 'Components/Onboarding',
  decorators: [withTheme],
  component: GetStartedComponent,
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
