import React from 'react'

import iconHover from '../../../static/images/zcash/plus-icon.svg'
import icon from '../../../static/images/zcash/plus-icon-gray.svg'
import MenuAction from '../../ui/MenuAction/MenuAction'
import MenuActionItem from '../../ui/MenuAction/MenuActionItem'

interface ChannelInputActionProps {
  onSendMoney: (...args: string[]) => void
  disabled: boolean
  targetRecipientAddress: string
}

export const ChannelInputAction: React.FC<ChannelInputActionProps> = ({
  onSendMoney,
  disabled = false,
  targetRecipientAddress
}) => {
  return (
    <MenuAction
      icon={icon}
      iconHover={iconHover}
      offset='-10 12'
      disabled={disabled}
      placement='top-end'
    >

      {/* Disable post offer button until it works */}
      {/* {channelData && !channelData.offerId ? (
        <MenuActionItem onClick={onPostOffer} title='Post an offer' />
      ) : (
        <></>
      )} */}

      <MenuActionItem
        onClick={() => onSendMoney('sendMoneySeparate', targetRecipientAddress)}
        title='Send money'
      />
    </MenuAction>
  )
}

export default ChannelInputAction
