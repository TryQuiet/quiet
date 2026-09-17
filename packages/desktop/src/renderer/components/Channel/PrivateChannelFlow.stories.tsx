import React, { useState } from 'react'
import { ComponentMeta } from '@storybook/react'
import { IconButton, Typography } from '@mui/material'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { withTheme, withDragDrop } from '../../storybook/decorators'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu/ContextMenu.component'
import { ChannelMembershipComponent, MEMBERS_IN_CHANNEL_TITLE } from './ChannelMembership/ChannelMembershipComponent'
import { AddMembersChannelComponent } from './AddMembersChannel/AddMembersChannelComponent'
import LockIcon from '../../static/images/components/lock'
import { User, UserProfile } from '@quiet/types'
import { useModal } from '../../containers/hooks'

/**
 * A clickable walkthrough of managing a private channel's membership, wired from the real
 * components rather than mocked screens. Storybook 6.5 here has addon-links but not
 * addon-interactions, so the flow is driven by local state in this story.
 *
 * It takes the path the app takes, step for step: inside a private channel, open the "..." menu,
 * choose "Members in this channel" to see who belongs, and from there — because this walkthrough
 * is an admin's — reach Add members by the panel's button. Pick people, each becomes a pill, and
 * confirm with Done.
 *
 * Adding members is not a separate menu entry: whether you may add is shown inside the panel by
 * that button, so a member who is not an admin sees the same list and stops there. See
 * "Private channels / Notes".
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

/** Only one of the channel, the menu and the two panels is on screen at a time, as in the app. */
type Step = 'channel' | 'menu' | 'membership' | 'addMembers'

const asModal = (open: boolean, handleClose: () => void) => {
  // useModal's handlers dispatch redux actions; this walkthrough drives the panels from local
  // state instead, so the modal half of each panel's props is stubbed.
  const stub = { open, handleOpen: () => undefined, handleClose }
  return stub as unknown as ReturnType<typeof useModal>
}

export const Walkthrough: React.FC = () => {
  const [step, setStep] = useState<Step>('channel')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [lastOutcome, setLastOutcome] = useState<string | undefined>(undefined)

  const members = memberIds.map(id => MEMBERS[id])

  const possibleMembers = Object.fromEntries(
    Object.entries(MEMBERS).map(([id, profile]) => [
      id,
      { ...profile, channels: memberIds.includes(id) ? [CHANNEL_ID] : [] },
    ])
  )

  const backToChannel = (outcome?: string) => {
    setStep('channel')
    setLastOutcome(outcome)
  }

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
        <IconButton onClick={() => setStep('menu')} data-testid={'walkthrough-channel-menu'}>
          <MoreHorizIcon />
        </IconButton>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Typography variant='body2'>
          {memberIds.length === 0
            ? 'Nobody has been added to this private channel yet. Open the "..." menu to see who belongs.'
            : `In this channel: ${memberIds.map(id => MEMBERS[id].nickname).join(', ')}.`}
        </Typography>
        {/*
          Spelled out so the three ways of leaving are distinguishable: the members panel's back
          arrow changes nothing, the picker's close abandons the picks, and its Done commits them.
          Each lands back in the channel — the "..." menu closes itself before the members panel
          opens (ChannelContextMenu.container), and that panel closes before the picker opens
          (ChannelMembership), so nothing steps backwards through the flow.
        */}
        {lastOutcome && (
          <Typography variant='caption' style={{ color: '#7F7F7F' }} data-testid={'walkthrough-outcome'}>
            {lastOutcome}
          </Typography>
        )}
      </div>

      <ContextMenu
        visible={step === 'menu'}
        handleClose={() => setStep('channel')}
        title={CHANNEL_NAME}
        titleIcon={<LockIcon fill='currentColor' style={{ fontSize: 16 }} />}
      >
        <ContextMenuItemList
          items={[
            {
              title: MEMBERS_IN_CHANNEL_TITLE,
              suffix: `${memberIds.length}`,
              action: () => {
                setStep('membership')
                setLastOutcome(undefined)
              },
            },
            // Delete channel is the admin's one destructive entry; both it and Export messages are
            // out of this walkthrough's scope.
            { title: 'Delete channel', destructive: true, action: () => undefined },
            { title: 'Export messages', action: () => undefined },
          ]}
        />
      </ContextMenu>

      <ChannelMembershipComponent
        {...asModal(step === 'membership', () =>
          backToChannel('Left the members panel with the back arrow — nothing changed.')
        )}
        channelName={CHANNEL_NAME}
        isDm={false}
        members={members}
        isUserConnected={() => false}
        // An admin's walkthrough, so the Add members button is here. A member sees this same list
        // without it.
        canManage
        openAddMembers={() => setStep('addMembers')}
      />

      <AddMembersChannelComponent
        {...asModal(step === 'addMembers', () =>
          backToChannel('Closed with ✕ — nobody was added, and you are back in the channel.')
        )}
        channelName={CHANNEL_NAME}
        channelId={CHANNEL_ID}
        allUsers={ALL_USERS}
        possibleMembers={possibleMembers}
        addMembersToChannel={(added: string[]) => {
          setMemberIds(current => [...new Set([...current, ...added])])
          backToChannel(
            `Confirmed with Done — added ${added.map(id => MEMBERS[id].nickname).join(', ')}, and you are back in the channel.`
          )
        }}
      />
    </div>
  )
}

// Named for what the walkthrough covers: the group node is already "Walkthrough", so a story
// called PrivateChannelWalkthrough stuttered as "Walkthrough / Private Channel Walkthrough".
export const AddMembersToAPrivateChannel = () => <Walkthrough />

const component: ComponentMeta<typeof Walkthrough> = {
  title: 'Private channels/Walkthrough',
  decorators: [withDragDrop, withTheme],
  component: Walkthrough,
  // Walkthrough is exported for the test to drive; only AddMembersToAPrivateChannel is a story, or
  // the same flow is listed twice.
  excludeStories: ['Walkthrough'],
  parameters: { layout: 'fullscreen' },
}

export default component
