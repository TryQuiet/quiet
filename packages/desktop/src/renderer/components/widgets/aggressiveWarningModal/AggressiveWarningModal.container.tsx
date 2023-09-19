import { capitalizeFirstLetter } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import React from 'react'
import { useSelector } from 'react-redux'
import { clearCommunity } from '../../..'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import AggressiveWarningModalComponent from './AggressiveWarningModal.component'

const AggressiveWarningModalContainer = () => {
  const aggressiveWarningModal = useModal(ModalName.aggressiveWarningModal)

  const community = useSelector(communities.selectors.currentCommunity)

  let communityName = ''

  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  const leaveCommunity = async () => {
    await clearCommunity()
  }

  return (
    <AggressiveWarningModalComponent
      communityName={communityName}
      leaveCommunity={leaveCommunity}
      {...aggressiveWarningModal}
    />
  )
}

export default AggressiveWarningModalContainer
