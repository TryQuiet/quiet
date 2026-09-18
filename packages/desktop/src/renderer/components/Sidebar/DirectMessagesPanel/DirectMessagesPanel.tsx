import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import DirectMessageListItem from './DirectMessageListItem'
import { PublicChannelStorage, UserProfile } from '@quiet/types'
import _ from 'lodash'
import { isDmConnected } from '@quiet/common'

export interface DirectMessagesPanelProps {
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  dmChannels: PublicChannelStorage[]
  unreadDms: string[]
  currentChannelId: string
  /**
   * Presence by user id, not by peer id: see connection.selectors.isUserConnected. A user with a
   * linked device has one endpoint per device and is online when any of them is connected.
   */
  isUserConnected: (userId: string | undefined) => boolean
  isTorInitialized: boolean
  setCurrentChannel: (channelId: string) => void
  openNewMessageWindow: () => void
}

export interface DmChannelUserData {
  connected: boolean | undefined
  user: UserProfile
}

/**
 * The avatar shown for a DM row, and whether it carries a presence dot.
 *
 * - a 1:1 DM shows the other participant, online when they are;
 * - a group DM shows one of the others, online when ANY other participant is;
 * - the conversation with yourself shows you, and "online" there means the app itself is up, so it
 *   follows Tor rather than a peer connection.
 */
const getUserDataForDmChannel = (
  dmChannel: PublicChannelStorage,
  me: UserProfile | undefined,
  userProfiles: Record<string, UserProfile>,
  isUserConnected: (userId: string | undefined) => boolean,
  isTorInitialized: boolean
): DmChannelUserData | undefined => {
  if (dmChannel.memberIds == null || me == null) {
    return undefined
  }

  const connected = isDmConnected(dmChannel.memberIds, me.userId, isUserConnected, isTorInitialized)

  if (dmChannel.memberIds.length === 1) {
    return { connected, user: me }
  }

  const notMeId = _.find(dmChannel.memberIds, memberId => memberId !== me.userId)
  if (notMeId == null) {
    return undefined
  }
  const userThatIsntMe = userProfiles[notMeId]
  if (userThatIsntMe == null) return undefined

  return { connected, user: userThatIsntMe }
}

const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({
  myUserProfile,
  userProfiles,
  dmChannels = [],
  unreadDms,
  currentChannelId,
  isUserConnected,
  isTorInitialized,
  setCurrentChannel,
  openNewMessageWindow,
}) => {
  return (
    <Grid container item xs direction='column'>
      <SidebarHeader
        title={'Direct messages'}
        tooltipText='Start a new DM'
        action={openNewMessageWindow}
        actionTitle={'createNewMessage'}
      />
      <List disablePadding data-testid='dm-list'>
        {dmChannels.map(channel => {
          const userData = getUserDataForDmChannel(
            channel,
            myUserProfile,
            userProfiles,
            isUserConnected,
            isTorInitialized
          )
          const unread = unreadDms.some(unreadDmId => unreadDmId === channel.id)
          const selected = currentChannelId === channel.id
          return (
            <DirectMessageListItem
              me={myUserProfile}
              userProfiles={userProfiles}
              userData={userData}
              channel={channel}
              key={channel.id}
              unread={unread}
              selected={selected}
              setCurrentChannel={setCurrentChannel}
            />
          )
        })}
      </List>
    </Grid>
  )
}

export default DirectMessagesPanel
