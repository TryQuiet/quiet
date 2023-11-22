import React from 'react'

import iconHover from '../../../static/images/zcash/plus-icon.svg'
import icon from '../../../static/images/zcash/plus-icon-gray.svg'
import MenuAction from '../../ui/MenuAction/MenuAction'
import MenuActionItem from '../../ui/MenuAction/MenuActionItem'

interface ChannelInputActionProps {
    disabled?: boolean
}

export const ChannelInputAction: React.FC<ChannelInputActionProps> = ({ disabled = false }) => {
    return (
        <MenuAction icon={icon} iconHover={iconHover} offset='-10 12' disabled={disabled} placement='top-end'>
            <MenuActionItem onClick={() => {}} title='Send money' />
        </MenuAction>
    )
}

export default ChannelInputAction
