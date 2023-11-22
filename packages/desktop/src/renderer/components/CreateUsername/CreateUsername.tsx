import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ErrorCodes, LoadingPanelType } from '@quiet/types'
import { communities, errors, identity, network } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'

const CreateUsername = () => {
    const dispatch = useDispatch()

    const currentCommunity = useSelector(communities.selectors.currentCommunity)
    const currentIdentity = useSelector(identity.selectors.currentIdentity)

    const createUsernameModal = useModal(ModalName.createUsernameModal)
    const loadingPanelModal = useModal(ModalName.loadingPanel)

    const error = useSelector(errors.selectors.registrarErrors)

    useEffect(() => {
        if (currentCommunity && !currentIdentity?.userCsr && !createUsernameModal.open) {
            createUsernameModal.handleOpen()
        }
        if (currentIdentity?.userCsr && createUsernameModal.open) {
            createUsernameModal.handleClose()
        }
    }, [currentIdentity, currentCommunity])

    const handleAction = (nickname: string) => {
        // Clear errors
        if (error) {
            dispatch(errors.actions.clearError(error))
        }

        dispatch(
            identity.actions.registerUsername({
                nickname,
            })
        )
        dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
        loadingPanelModal.handleOpen()
    }

    return (
        <CreateUsernameComponent
            {...createUsernameModal}
            registerUsername={handleAction}
            certificateRegistrationError={error?.code === ErrorCodes.FORBIDDEN ? error.message : undefined}
            certificate={currentIdentity?.userCertificate}
        />
    )
}

export default CreateUsername
