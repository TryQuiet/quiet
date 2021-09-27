import React from 'react'

import addIcon from '../../../static/images/zcash/add-icon.svg'
import MenuAction from '../../ui/MenuAction/MenuAction'
import MenuActionItem from '../../ui/MenuAction/MenuActionItem'
import CreateChannelModal from '../../../containers/widgets/channels/CreateChannelModal'
import { Action, ActionFunction0 } from 'redux-actions'

interface AddChannelActionProps {
  openCreateModal: ActionFunction0<Action<{
    modalName: string
    data: any
  }>>
}

export const AddChannelAction: React.FC<AddChannelActionProps> = ({ openCreateModal }) => {
  return (
    <React.Fragment>
      <MenuAction
        icon={addIcon}
        iconHover={addIcon}
        offset='0 8'
      >
        <MenuActionItem onClick={openCreateModal} title='Create' />
      </MenuAction>
      <CreateChannelModal />
    </React.Fragment>
  )
}

export default AddChannelAction
