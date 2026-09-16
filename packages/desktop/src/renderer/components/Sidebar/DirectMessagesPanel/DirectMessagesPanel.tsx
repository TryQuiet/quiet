import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import UserProfileListItem from './UserProfileListItem'
import { DeviceNetworkEndpoint, UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'

export interface DirectMessagesPanelProps {
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  userProfileContextMenu: ReturnType<typeof useContextMenu>
  connectedPeers: string[]
  networkEndpoints: DeviceNetworkEndpoint[]
  isTorInitialized: boolean
}

const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({
  myUserProfile,
  userProfiles,
  userProfileContextMenu, // TODO: replace with direct message hook once implemented
  connectedPeers,
  networkEndpoints,
  isTorInitialized,
}) => {
  const isUserConnected = (userId: string): boolean =>
    networkEndpoints.some(endpoint => endpoint.userId === userId && connectedPeers.includes(endpoint.peerId))

  return (
    <Grid container item xs direction='column'>
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
            const aConnected = isUserConnected(a.userId)
            const bConnected = isUserConnected(b.userId)
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
              connected={isUserConnected(user.userId)}
            />
          ))}
      </List>
    </Grid>
  )
}

export default DirectMessagesPanel
