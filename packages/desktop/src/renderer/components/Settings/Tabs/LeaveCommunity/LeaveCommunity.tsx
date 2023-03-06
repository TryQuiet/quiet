import React from 'react'

import { useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'

import { LeaveCommunityComponent } from './LeaveCommunityComponent'

import { clearCommunity } from '../../../..'

import { useModal } from '../../../../containers/hooks'
import { ModalName } from '../../../../sagas/modals/modals.types'

import { capitalizeFirstLetter } from '../../../../../utils/functions/capitalize'

export const LeaveCommunity: React.FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)

  const communityName = capitalizeFirstLetter(community.name)

  const leaveCommunity = async () => {
    await clearCommunity()
  }

  const modal = useModal(ModalName.leaveCommunity)

  return <LeaveCommunityComponent communityName={communityName} leaveCommunity={leaveCommunity} {...modal} />
}
