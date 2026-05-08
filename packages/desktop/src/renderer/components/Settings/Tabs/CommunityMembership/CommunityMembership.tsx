import React, { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { connection, network, users } from '@quiet/state-manager'

import { CommunityMembershipComponent } from './CommunityMembership.component'
import { createLogger } from '../../../../logger'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../../hooks/useContextMenu'
import { MenuName } from '../../../../../const/MenuNames.enum'

const LOGGER = createLogger('CommunityMembership')

export const CommunityMembership: FC = () => {
  const dispatch = useDispatch()

  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const connectedPeers = useSelector(network.selectors.connectedPeers)
  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const openUserProfilePanel = (userProfile: UserProfile | undefined) => {
    if (userProfile) {
      userProfileContextMenu.handleOpen({ userProfile })
    } else {
      userProfileContextMenu.handleOpen()
    }
  }

  return (
    <CommunityMembershipComponent
      userProfiles={userProfiles}
      me={me}
      connectedPeers={connectedPeers}
      openUserProfilePanel={openUserProfilePanel}
    />
  )
}
