import { capitalizeFirstLetter } from '@quiet/common'
import { communities, users } from '@quiet/state-manager'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
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

    useEffect(() => {
        if (duplicateCerts) {
            possibleImpersonationAttackModal.handleOpen()
        }
    }, [duplicateCerts])

    return (
        <PossibleImpersonationAttackModalComponent
            communityName={communityName}
            {...possibleImpersonationAttackModal}
        />
    )
}

export default PossibleImpersonationAttackModalContainer
