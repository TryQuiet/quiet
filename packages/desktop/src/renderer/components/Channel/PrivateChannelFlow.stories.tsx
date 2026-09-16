import React, { useState } from 'react'
import { ComponentMeta } from '@storybook/react'
import { IconButton, Typography } from '@mui/material'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { withTheme, withDragDrop } from '../../storybook/decorators'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu/ContextMenu.component'
import { AddMembersChannelComponent } from './AddMembersChannel/AddMembersChannelComponent'
import LockIcon from '../../static/images/components/lock'
import { User, UserProfile } from '@quiet/types'
import { useModal } from '../../containers/hooks'

/**
 * A clickable walkthrough of managing a private channel's membership, wired from the real
 * components rather than mocked screens. Storybook 6.5 here has addon-links but not
 * addon-interactions, so the flow is driven by local state in this story.
 *
 * It starts where the feature actually starts: inside a private channel. Open the channel's "..."
 * menu, choose Add members, pick people — each becomes a pill — and confirm with Done.
 */
const CHANNEL_NAME = 'fundraising-and-events'
const CHANNEL_ID = 'fundraisingChannelId'

const NAMES = ['denise', 'gordon', 'annabelle', 'christopher', 'evangelina']

const MEMBERS: Record<string, UserProfile> = Object.fromEntries(
  NAMES.map(nickname => [
    `${nickname}UserId`,
    {
      userId: `${nickname}UserId`,
      nickname,
      userData: { peerId: `${nickname}PeerId`, onionAddress: `${nickname}.onion` },
      channels: [],
    },
  ])
)

const ALL_USERS: Record<string, User> = Object.fromEntries(
  Object.values(MEMBERS).map(profile => [
    profile.userId,
    { isRegistered: true, isDuplicated: false, userId: profile.userId },
  ])
)

export const Walkthrough: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [addingMembers, setAddingMembers] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])

  const possibleMembers = Object.fromEntries(
    Object.entries(MEMBERS).map(([id, profile]) => [
      id,
      { ...profile, channels: memberIds.includes(id) ? [CHANNEL_ID] : [] },
    ])
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Rubik, sans-serif' }}>
      {/* The channel's own header, which is where the "..." lives. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
          height: 60,
          borderBottom: '1px solid #F0F0F0',
        }}
      >
        <LockIcon fill='currentColor' style={{ fontSize: 16 }} />
        <Typography style={{ fontWeight: 500, fontSize: 16, flexGrow: 1 }}>{CHANNEL_NAME}</Typography>
        <Typography variant='caption' style={{ color: '#7F7F7F' }}>
          {memberIds.length} {memberIds.length === 1 ? 'member' : 'members'}
        </Typography>
        <IconButton onClick={() => setMenuOpen(true)} data-testid={'walkthrough-channel-menu'}>
          <MoreHorizIcon />
        </IconButton>
      </div>

      <div style={{ padding: 24 }}>
        <Typography variant='body2'>
          {memberIds.length === 0
            ? 'Nobody has been added to this private channel yet. Open the "..." menu to add members.'
            : `In this channel: ${memberIds.map(id => MEMBERS[id].nickname).join(', ')}.`}
        </Typography>
      </div>

      <ContextMenu
        visible={menuOpen}
        handleClose={() => setMenuOpen(false)}
        title={CHANNEL_NAME}
        titleIcon={<LockIcon fill='currentColor' style={{ fontSize: 16 }} />}
      >
        <ContextMenuItemList
          items={[
            {
              title: 'Add members',
              action: () => {
                setMenuOpen(false)
                setAddingMembers(true)
              },
            },
            { title: 'Delete', action: () => undefined },
            { title: 'Export messages', action: () => undefined },
          ]}
        />
      </ContextMenu>

      <AddMembersChannelComponent
        // useModal's handlers return redux actions; this walkthrough drives the panel from local
        // state instead, so the modal half of the props is stubbed.
        {...({
          open: addingMembers,
          handleOpen: () => undefined,
          handleClose: () => setAddingMembers(false),
        } as unknown as ReturnType<typeof useModal>)}
        channelName={CHANNEL_NAME}
        channelId={CHANNEL_ID}
        allUsers={ALL_USERS}
        possibleMembers={possibleMembers}
        addMembersToChannel={(added: string[]) => {
          setMemberIds(current => [...new Set([...current, ...added])])
          setAddingMembers(false)
        }}
      />
    </div>
  )
}

export const PrivateChannelWalkthrough = () => <Walkthrough />

const component: ComponentMeta<typeof Walkthrough> = {
  title: 'Private channels/Walkthrough',
  decorators: [withDragDrop, withTheme],
  component: Walkthrough,
  parameters: { layout: 'fullscreen' },
}

export default component
