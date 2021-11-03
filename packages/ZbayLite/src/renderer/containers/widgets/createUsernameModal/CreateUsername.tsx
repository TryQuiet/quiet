import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity, socketActionTypes } from '@zbayapp/nectar'
import CreateUsernameModalComponent from '../../../components/widgets/createUsername/CreateUsernameModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { CommunityAction } from '../../../components/widgets/performCommunityAction/community.keys'

export interface CreateUsernameModalProps {
  communityAction: CommunityAction
  communityData: string
}

const CreateUsernameModal = () => {
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')

  const id = useSelector(identity.selectors.currentIdentity)
  const certificate = useSelector(identity.selectors.currentIdentity)?.userCertificate

  const communityErrors = useSelector(errors.selectors.currentCommunityErrorsByType)
  const error = communityErrors?.[socketActionTypes.REGISTRAR]

  const createUsernameModal = useModal<CreateUsernameModalProps>(ModalName.createUsernameModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)

  useEffect(() => {
    if (id?.hiddenService) {
      dispatch(identity.actions.registerUsername(username))
    }
  }, [id?.hiddenService])

  useEffect(() => {
    if (certificate) {
      createUsernameModal.handleClose()
      joinCommunityModal.handleClose()
      createCommunityModal.handleClose()
    }
  }, [certificate])

  const handleAction = (payload: { nickname: string }) => {
    setUsername(payload.nickname)
    const value = createUsernameModal.communityData
    const action =
      createUsernameModal.communityAction === CommunityAction.Create
        ? communities.actions.createNewCommunity(value)
        : communities.actions.joinCommunity(value)
    /* Launch/create community */
    dispatch(action)
  }

  return (
    <CreateUsernameModalComponent
      {...createUsernameModal}
      initialValue={''}
      handleRegisterUsername={handleAction}
      certificateRegistrationError={error?.message}
      certificate={certificate}
    />
  )
}

export default CreateUsernameModal
