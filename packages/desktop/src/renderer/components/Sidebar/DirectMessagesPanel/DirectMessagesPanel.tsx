import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import DirectMessageListItem from './DirectMessageListItem'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'

export interface DirectMessagesPanelProps {
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  userProfileContextMenu: ReturnType<typeof useContextMenu>
  connectedPeers: string[]
  isTorInitialized: boolean
  setOrCreateDmChannel: (memberIds: string[]) => void
  openOrCloseNewMessageWindow: (isOpen: boolean) => void
}

const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({
  myUserProfile,
  userProfiles,
  userProfileContextMenu, // TODO: replace with direct message hook once implemented
  connectedPeers,
  isTorInitialized,
  setOrCreateDmChannel,
  openOrCloseNewMessageWindow,
}) => {
  return (
    <Grid container item xs direction='column'>
      <SidebarHeader
        title={'Direct messages'}
        tooltipText='Start a new DM'
        action={() => openOrCloseNewMessageWindow(true)}
        actionTitle={'createNewMessage'}
      />
      <List disablePadding data-testid='usersList'>
        {myUserProfile && (
          <DirectMessageListItem
            myUserProfile={myUserProfile}
            userProfile={myUserProfile}
            key={myUserProfile.userId}
            connected={isTorInitialized}
            userProfileContextMenu={userProfileContextMenu}
            setOrCreateDmChannel={setOrCreateDmChannel}
          />
        )}
        {Object.values(userProfiles)
          .filter(user => !myUserProfile || user.userId !== myUserProfile.userId)
          .sort((a, b) => {
            const aConnected =
              a.userData != null && a.userData.peerId != null && connectedPeers.includes(a.userData.peerId)
            const bConnected =
              b.userData != null && b.userData.peerId != null && connectedPeers.includes(b.userData.peerId)
            if (aConnected === bConnected) {
              return a.nickname.localeCompare(b.nickname, undefined, { sensitivity: 'base' })
            }
            return aConnected ? -1 : 1
          })
          .map(user => (
            <DirectMessageListItem
              myUserProfile={myUserProfile}
              userProfile={user}
              key={user.userId}
              userProfileContextMenu={userProfileContextMenu}
              connected={user.userData?.peerId != null && connectedPeers.includes(user.userData.peerId)}
              setOrCreateDmChannel={setOrCreateDmChannel}
            />
          ))}
      </List>
    </Grid>
  )
}

export default DirectMessagesPanel
