import React, { useState } from 'react'
import { ComponentMeta } from '@storybook/react'
import { Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'

import { withTheme, withDragDrop } from '../../storybook/decorators'
import CreateChannelComponent from './CreateChannel/CreateChannelComponent'
import { AddMembersChannelComponent } from './AddMembersChannel/AddMembersChannelComponent'
import ChannelTypeIcon from '../widgets/channels/ChannelTypeIcon'
import { User, UserProfile } from '@quiet/types'
import { useModal } from '../../containers/hooks'

/**
 * A clickable walkthrough of private channels, wired from the real components rather than mocked
 * screens. Storybook 6.5 here has addon-links but not addon-interactions, so the flow is driven by
 * local state in this story.
 *
 * Start with no channels, create one (optionally private), then open it to manage who is in it.
 */

const MEMBERS: Record<string, UserProfile> = {
  denise: { userId: 'denise', nickname: 'denise' },
  gordon: { userId: 'gordon', nickname: 'gordon' },
  annabelle: { userId: 'annabelle', nickname: 'annabelle' },
  christopher: { userId: 'christopher', nickname: 'christopher' },
}

const ALL_USERS: Record<string, User> = Object.fromEntries(
  Object.values(MEMBERS).map(profile => [
    profile.userId,
    { isRegistered: true, isDuplicated: false, userId: profile.userId },
  ])
)

interface WalkthroughChannel {
  id: string
  name: string
  isPublic: boolean
  memberIds: string[]
}

export const Walkthrough: React.FC = () => {
  const [channels, setChannels] = useState<WalkthroughChannel[]>([])
  const [creating, setCreating] = useState(false)
  const [managing, setManaging] = useState<string | undefined>(undefined)

  const managed = channels.find(channel => channel.id === managing)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Rubik, sans-serif' }}>
      <div style={{ width: 260, background: '#521C74', color: '#fff', padding: 16 }}>
        <Typography style={{ color: '#fff', fontWeight: 500, marginBottom: 8 }}>Channels</Typography>
        {channels.length === 0 && (
          <Typography variant='caption' style={{ color: '#D9C7E6' }}>
            No channels yet — create one.
          </Typography>
        )}
        <List dense>
          {channels.map(channel => (
            <ListItemButton key={channel.id} onClick={() => setManaging(channel.id)} sx={{ color: '#fff' }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <ChannelTypeIcon isPublic={channel.isPublic} style={{ fontSize: 16, color: '#fff' }} />
              </ListItemIcon>
              <ListItemText primary={channel.name} secondary={`${channel.memberIds.length} members`} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ borderColor: '#7A4F92', marginY: 1 }} />
        <Button variant='contained' onClick={() => setCreating(true)} data-testid={'walkthrough-create'}>
          + Create channel
        </Button>
      </div>

      <div style={{ flexGrow: 1, padding: 24 }}>
        <Typography variant='body2'>
          {managed
            ? `Managing membership for ${managed.isPublic ? '#' : '🔒 '}${managed.name}.`
            : 'Create a channel on the left, then select it to manage who belongs to it.'}
        </Typography>
      </div>

      <CreateChannelComponent
        open={creating}
        canCreateChannel={true}
        canCreatePrivateChannel={true}
        createChannel={(name: string, isPublic: boolean) => {
          setChannels(existing => [...existing, { id: name, name, isPublic, memberIds: [] }])
          setCreating(false)
        }}
        handleClose={() => setCreating(false)}
        clearErrorsDispatch={() => {}}
      />

      {managed && (
        <AddMembersChannelComponent
          // useModal's handlers return redux actions; this walkthrough drives the panel from local
          // state instead, so the modal half of the props is stubbed.
          {...({
            open: true,
            handleOpen: () => undefined,
            handleClose: () => setManaging(undefined),
          } as unknown as ReturnType<typeof useModal>)}
          channelName={managed.name}
          channelId={managed.id}
          allUsers={ALL_USERS}
          possibleMembers={MEMBERS}
          addMembersToChannel={(memberIds: string[]) => {
            setChannels(existing =>
              existing.map(channel =>
                channel.id === managed.id
                  ? { ...channel, memberIds: [...new Set([...channel.memberIds, ...memberIds])] }
                  : channel
              )
            )
            setManaging(undefined)
          }}
        />
      )}
    </div>
  )
}

export const PrivateChannelWalkthrough = () => <Walkthrough />

const component: ComponentMeta<typeof Walkthrough> = {
  title: 'Flows/Private channels',
  decorators: [withDragDrop, withTheme],
  component: Walkthrough,
  parameters: { layout: 'fullscreen' },
}

export default component
