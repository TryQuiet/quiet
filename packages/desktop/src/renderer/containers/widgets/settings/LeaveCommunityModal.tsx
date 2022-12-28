import React from 'react'
import { useSelector } from 'react-redux'
import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { communities } from '@quiet/state-manager'
import LeaveCommunityModal from '../../../components/widgets/settings/LeaveCommunityModal/LeaveCommunityModal'

const LeaveCommunityContainer = () => {
    const modal = useModal(ModalName.leaveCommunityModal)
    const communityName = useSelector(communities.selectors.currentCommunity)?.name

    return <LeaveCommunityModal communityName={communityName} {...modal} />
}

export default LeaveCommunityContainer
