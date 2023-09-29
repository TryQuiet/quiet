import { capitalizeFirstLetter } from '@quiet/common'
import { communities, users } from '@quiet/state-manager'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { clearCommunity } from '../../..'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import AggressiveWarningModalComponent from './AggressiveWarningModal.component'

const AggressiveWarningModalContainer = () => {
  const aggressiveWarningModal = useModal(ModalName.aggressiveWarningModal)

  const community = useSelector(communities.selectors.currentCommunity)
  const duplicateCerts = useSelector(users.selectors.duplicateCerts)

  let communityName = '...'

  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  const leaveCommunity = async () => {
    await clearCommunity()
  }

  useEffect(() => {
    if (duplicateCerts) {
      aggressiveWarningModal.handleOpen()
    }
  }, [duplicateCerts])

  return (
    <AggressiveWarningModalComponent
      communityName={communityName}
      leaveCommunity={leaveCommunity}
      {...aggressiveWarningModal}
    />
  )
}

export default AggressiveWarningModalContainer
