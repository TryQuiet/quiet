import { communities } from '@quiet/state-manager'
import React from 'react'

import { useSelector } from 'react-redux'

import { LeaveCommunityComponent } from './LeaveCommunityComponent'

export const LeaveCommunity: React.FC = () => {
  const leaveCommunity = () => {}

  const community = useSelector(communities.selectors.currentCommunity)

  return <LeaveCommunityComponent communityName={community.name} leaveCommunity={leaveCommunity} />
}
