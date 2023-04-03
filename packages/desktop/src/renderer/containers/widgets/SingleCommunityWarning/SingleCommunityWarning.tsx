import React from 'react'
import SingleCommunityWarningModal from '../../../components/widgets/SingleCommunityWarning/SingleCommunityWarningModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const SingleCommunityWarning = () => {
  const modal = useModal(ModalName.singleCommunityWarningModal)
  return <SingleCommunityWarningModal {...modal} />
}

export default SingleCommunityWarning
