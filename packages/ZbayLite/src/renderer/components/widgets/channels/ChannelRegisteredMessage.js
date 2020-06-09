import React, { Fragment } from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import SendMessagePopover from '../../../containers/widgets/channels/SendMessagePopover'
import WelcomeMessage from './WelcomeMessage'

const styles = theme => ({
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
})

export const ChannelRegisteredMessage = ({
  classes,
  message,
  username,
  address,
  onChannelClick
}) => {
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
                #{message.name}
              </span>{' '}
              on zbay!
            </span>
          </Fragment>
        }
        timestamp={message.createdAt}
      />
      <SendMessagePopover
        username={username}
        address={address}
        anchorEl={anchorEl}
        handleClose={handleClose}
        isUnregistered={false}
      />
    </>
  )
}
ChannelRegisteredMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  onChannelClick: PropTypes.func.isRequired,
  message: PropTypes.instanceOf(Immutable.Record).isRequired
}

ChannelRegisteredMessage.defaultProps = {}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelRegisteredMessage)
