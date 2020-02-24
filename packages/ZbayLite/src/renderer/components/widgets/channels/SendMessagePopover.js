import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Popover from '@material-ui/core/Popover'
import Jdenticon from 'react-jdenticon'
import { withStyles } from '@material-ui/core/styles'

import QuickActionLayout from '../../ui/QuickActionLayout'

const styles = theme => ({})

export const SendMessagePopover = ({
  classes,
  username,
  address,
  anchorEl,
  handleClose,
  isUnregistered,
  createContact,
  history
}) => {
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined
  return (
    <Popover
      className={classes.popover}
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
        buttonName='Send message'
        handleClose={handleClose}
        warrning={
          isUnregistered ? 'Unregistered users cannot receive messages.' : null
        }
        onClick={() =>
          createContact({
            contact: {
              replyTo: address,
              username
            },
            history
          })
        }
      >
        <Jdenticon size='100' value={username} />
      </QuickActionLayout>
    </Popover>
  )
}

SendMessagePopover.propTypes = {
  classes: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
  anchorEl: PropTypes.bool,
  isUnregistered: PropTypes.bool
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendMessagePopover)
