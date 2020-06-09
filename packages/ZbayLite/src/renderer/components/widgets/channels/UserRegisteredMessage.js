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
  }
})

export const UserRegisteredMessage = ({ classes, message }) => {
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
            <span
              className={classes.nickname}
              onClick={handleClick}
            >
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
UserRegisteredMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(Immutable.Record).isRequired
}

UserRegisteredMessage.defaultProps = {}

export default R.compose(React.memo, withStyles(styles))(UserRegisteredMessage)
