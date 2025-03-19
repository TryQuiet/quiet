import { capitalizeFirstLetter } from '@quiet/common'
import { communities } from '@quiet/state-manager'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import PossibleImpersonationAttackModalComponent from './PossibleImpersonationAttackModal.component'

const PossibleImpersonationAttackModalContainer = () => {
  const possibleImpersonationAttackModal = useModal(ModalName.possibleImpersonationAttackModal)

  const community = useSelector(communities.selectors.currentCommunity)
  // const duplicateUsers = useSelector(users.selectors.duplicateUsers)
  const duplicateUsers = false

  let communityName = '...'

  if (community?.name) {
    communityName = capitalizeFirstLetter(community.name)
  }

  useEffect(() => {
    if (duplicateUsers) {
      possibleImpersonationAttackModal.handleOpen()
    }
  }, [duplicateUsers])

  return (
    <PossibleImpersonationAttackModalComponent communityName={communityName} {...possibleImpersonationAttackModal} />
  )
}

export default PossibleImpersonationAttackModalContainer
