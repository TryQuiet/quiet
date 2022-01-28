import React from 'react'

import Moderators from '../../../components/widgets/channelSettings/Moderators'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const ModeratorsContainer: React.FC = () => {
  const openAddModerator = useModal(ModalName.addModerator)

  return <Moderators openAddModerator={openAddModerator.handleOpen} moderators={[]} users={{}} />
}
export default ModeratorsContainer
