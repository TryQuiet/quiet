import React from 'react'
import Popover from '@mui/material/Popover'
import Jdenticon from '../../Jdenticon/Jdenticon'
import { ISendMessagePopoverProps } from './SendMessagePopover.d'
import QuickActionLayout from '../../ui/QuickActionLayout/QuickActionLayout'

export const SendMessagePopover: React.FC<ISendMessagePopoverProps> = ({
  username,
  address,
  anchorEl,
  handleClose,
  message,
  createNewContact,
  history,
  users
}) => {
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined
  const registeredUsername = Array.from(Object.values(users)).filter(
    (obj) => obj.address === address
  )[0]
  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <QuickActionLayout
        main={username}
        buttonName="Send message"
        handleClose={handleClose}
        onClick={() => {
          if (message?.publicKey || registeredUsername?.publicKey) {
            createNewContact({
              contact: {
                address,
                nickname: username,
                publicKey: message?.publicKey || registeredUsername?.publicKey
              },
              history
            })
          }
        }}
      >
        <Jdenticon size="100" value={username} />
      </QuickActionLayout>
    </Popover>
  )
}

export default SendMessagePopover
