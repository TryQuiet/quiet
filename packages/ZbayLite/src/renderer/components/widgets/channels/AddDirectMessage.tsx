import React from 'react'

import MenuAction from '../../ui/MenuAction/MenuAction'
import addIcon from '../../../static/images/zcash/add-icon.svg'
import { Action, ActionFunction0 } from 'redux-actions'

interface AddDirectMessageProps {
  openModal: ActionFunction0<Action<{
    modalName: string
    data: any
  }>>
}

export const AddDirectMessage: React.FC<AddDirectMessageProps> = ({ openModal }) => {
  return (
    <React.Fragment>
      <MenuAction
        icon={addIcon}
        iconHover={addIcon}
        offset='0 8'
        onClick={openModal}
      />
    </React.Fragment>
  )
}

export default AddDirectMessage
