import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import MaterialSnackbar from '@material-ui/core/Snackbar'
import SnackbarContent from './SnackbarContent'

const styles = theme => ({
  fullWidthBottom: {
    left: 0,
    right: 0,
    bottom: 0
  },
  fullWidthTop: {
    left: 0,
    right: 0,
    bottom: 0
  }
})

export const Snackbar = ({
  classes,
  variant,
  open,
  onClose,
  position,
  fullWidth,
  message
}) => (
  <MaterialSnackbar
    anchorOrigin={position}
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    classes={{
      anchorOriginTopCenter: classNames({
        [classes.fullWidthTop]: fullWidth
      }),
      anchorOriginBottomCenter: classNames({
        [classes.fullWidthBottom]: fullWidth
      }),
      anchorOriginTopRight: classNames({
        [classes.fullWidthTop]: fullWidth
      }),
      anchorOriginBottomRight: classNames({
        [classes.fullWidthBottom]: fullWidth
      }),
      anchorOriginTopLeft: classNames({
        [classes.fullWidthTop]: fullWidth
      }),
      anchorOriginBottomLeft: classNames({
        [classes.fullWidthBottom]: fullWidth
      })
    }}
  >
    <SnackbarContent
      variant={variant}
      message={message}
      fullWidth={fullWidth}
      onClose={onClose}
    />
  </MaterialSnackbar>
)

Snackbar.propTypes = {
  classes: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'loading']).isRequired,
  open: PropTypes.bool.isRequired,
  position: PropTypes.exact({
    vertical: PropTypes.oneOf(['bottom', 'top']),
    horizontal: PropTypes.oneOf(['left', 'right'])
  }).isRequired,
  fullWidth: PropTypes.bool,
  onClose: PropTypes.func,
  message: PropTypes.string.isRequired
}

Snackbar.defaultProps = {
  position: { vertical: 'bottom', horizontal: 'left' },
  fullWidth: false
}

export default React.memo(withStyles(styles)(Snackbar))
