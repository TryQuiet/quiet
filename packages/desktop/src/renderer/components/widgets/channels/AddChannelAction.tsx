import React from 'react'

import addIcon from '../../../static/images/zcash/add-icon.svg'
import MenuAction from '../../ui/MenuAction/MenuAction'
import MenuActionItem from '../../ui/MenuAction/MenuActionItem'

interface AddChannelActionProps {
    openCreateModal: () => void
}

export const AddChannelAction: React.FC<AddChannelActionProps> = ({ openCreateModal }) => {
    return (
        <React.Fragment>
            <MenuAction icon={addIcon} iconHover={addIcon} offset='0 8'>
                <MenuActionItem onClick={openCreateModal} title='Create' />
            </MenuAction>
        </React.Fragment>
    )
}

export default AddChannelAction
