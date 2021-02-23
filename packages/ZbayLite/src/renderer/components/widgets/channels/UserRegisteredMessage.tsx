import React, { Fragment } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import SendMessagePopover from '../../../containers/widgets/channels/SendMessagePopover'
import WelcomeMessage from './WelcomeMessage'

import { IUserRegisteredMessageProps } from './UserRegisteredMessage.d'

const useStyles = makeStyles({
  nickname: {
    fontWeight: 'bold',
    cursor: 'pointer'
  }
})

export const UserRegisteredMessage: React.FC<IUserRegisteredMessageProps> = ({
  message
}) => {
  const classes = useStyles({})
  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => setAnchorEl(null)
  return (
    <>
      <WelcomeMessage
        message={
          <Fragment>
            <span className={classes.nickname} onClick={handleClick}>
              {message.nickname}
            </span>
            <span> just registered a username on zbay!</span>
          </Fragment>
        }
        timestamp={message.createdAt}
      />
      <SendMessagePopover
        username={message.nickname}
        address={message.address}
        anchorEl={anchorEl}
        handleClose={handleClose}
        isUnregistered={false}
      />
    </>
  )
}

export default UserRegisteredMessage
