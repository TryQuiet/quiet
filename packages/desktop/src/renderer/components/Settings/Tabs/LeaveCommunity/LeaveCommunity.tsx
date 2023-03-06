import React from 'react'

import { useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { LeaveCommunityComponent } from './LeaveCommunityComponent'

import { clearCommunity } from '../../../..'

export const LeaveCommunity: React.FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)

  const leaveCommunity = async () => {
    await clearCommunity()
  }

  return <LeaveCommunityComponent communityName={community.name} leaveCommunity={leaveCommunity} />
}
