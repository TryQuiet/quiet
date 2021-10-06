import React, { Fragment } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import SendMessagePopover from '../../../containers/widgets/channels/SendMessagePopover'
import WelcomeMessage from './WelcomeMessage'
import { DisplayableMessage } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'

const useStyles = makeStyles((theme) => ({
  nickname: {
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  link: {
    color: theme.palette.colors.lushSky,
    backgroundColor: theme.palette.colors.lushSky12,
    borderRadius: 4,
    cursor: 'pointer'
  }
}))

interface ChannelRegisteredMessageProps {
  message: DisplayableMessage
  username: string
  onChannelClick: () => void
}

export const ChannelRegisteredMessage: React.FC<ChannelRegisteredMessageProps> = ({
  message,
  username,
  onChannelClick
}) => {
  const classes = useStyles({})
  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => setAnchorEl(null)
  return (
    <>
      <WelcomeMessage
        message={
          <Fragment>
            <span className={classes.nickname} onClick={handleClick}>
              {username}
            </span>
            <span>
              {' '}
              just published{' '}
              <span className={classes.link} onClick={onChannelClick}>
                #{message.nickname}
              </span>{' '}
              on zbay!
            </span>
          </Fragment>
        }
        timestamp={message.createdAt}
      />
      <SendMessagePopover
        username={username}
        anchorEl={anchorEl}
        handleClose={handleClose}
        isUnregistered={false}
      />
    </>
  )
}

export default ChannelRegisteredMessage
