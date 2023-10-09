import { capitalizeFirstLetter } from '@quiet/common'
import { communities, users } from '@quiet/state-manager'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { clearCommunity } from '../../..'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import PossibleImpersonationAttackModalComponent from './PossibleImpersonationAttackModal.component'

const PossibleImpersonationAttackModalContainer = () => {
  const possibleImpersonationAttackModal = useModal(ModalName.possibleImpersonationAttackModal)

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
      possibleImpersonationAttackModal.handleOpen()
    }
  }, [duplicateCerts])

  return (
    <PossibleImpersonationAttackModalComponent
      communityName={communityName}
      leaveCommunity={leaveCommunity}
      {...possibleImpersonationAttackModal}
    />
  )
}

export default PossibleImpersonationAttackModalContainer
