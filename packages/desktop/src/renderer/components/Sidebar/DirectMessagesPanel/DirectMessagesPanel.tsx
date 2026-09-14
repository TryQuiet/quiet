import React from 'react'
import List from '@mui/material/List'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import UserProfileListItem from './UserProfileListItem'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'

export interface DirectMessagesPanelProps {
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  userProfileContextMenu: ReturnType<typeof useContextMenu>
  connectedPeers: string[]
  isTorInitialized: boolean
}

/**
 * The library's "Direct messages" section (`6218:16416`), carrying Quiet's
 * members instead: Quiet has no direct messages, so the section keeps the app's
 * own title, "Users", and has no (+) — you do not start a conversation here.
 * The rows are the library's `List item--people`.
 */
const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({
  myUserProfile,
  userProfiles,
  userProfileContextMenu, // TODO: replace with direct message hook once implemented
  connectedPeers,
  isTorInitialized,
}) => {
  return (
    <div>
      <SidebarHeader title={'Users'} tooltipText='List of users in this workspace' />
      <List disablePadding data-testid='usersList'>
        {myUserProfile && (
          <UserProfileListItem
            userProfile={myUserProfile}
            key={myUserProfile.userId}
            connected={isTorInitialized}
            userProfileContextMenu={userProfileContextMenu}
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
            <UserProfileListItem
              userProfile={user}
              key={user.userId}
              userProfileContextMenu={userProfileContextMenu}
              connected={user.userData?.peerId != null && connectedPeers.includes(user.userData.peerId)}
            />
          ))}
      </List>
    </div>
  )
}

export default DirectMessagesPanel
