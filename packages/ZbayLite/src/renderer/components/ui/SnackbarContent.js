import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import IconButton from '@material-ui/core/IconButton'
import CircularProgress from '@material-ui/core/CircularProgress'
import SnackbarContentMaterial from '@material-ui/core/SnackbarContent'

import CloseIcon from '@material-ui/icons/Close'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ErrorIcon from '@material-ui/icons/Error'
import InfoIcon from '@material-ui/icons/Info'
import WarningIcon from '@material-ui/icons/Warning'

import green from '@material-ui/core/colors/green'
import blue from '@material-ui/core/colors/blue'
import amber from '@material-ui/core/colors/amber'

const styles = theme => ({
  close: {
    padding: theme.spacing(0.5),
    margin: 0
  },
  success: {
    backgroundColor: green[600]
  },
  error: {
    backgroundColor: theme.palette.error.dark
  },
  info: {
    backgroundColor: blue[600]
  },
  loading: {
    backgroundColor: blue[400],
    color: '#fff'
  },
  loadingIcon: {
    color: '#fff',
    opacity: 1
  },
  warning: {
    backgroundColor: amber[700]
  },
  fullWidth: {
    'max-width': 'none',
    'flex-grow': 1
  },
  icon: {
    fontSize: 20,
    opacity: 0.9
  },
  content: {
    display: 'flex',
    alignItems: 'center'
  },
  message: {
    paddingLeft: theme.spacing(2)
  }
})

const iconVariants = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
  loading: CircularProgress
}

export const SnackbarContent = ({
  classes,
  variant,
  message,
  onClose,
  fullWidth
}) => {
  const Icon = iconVariants[variant]
  const closeAction = (
    <IconButton
      key='close'
      color='inherit'
      className={classes.close}
      onClick={onClose}
    >
      <CloseIcon className={classes.icon} />
    </IconButton>
  )
  const action = variant !== 'loading' ? [closeAction] : []
  return (
    <SnackbarContentMaterial
      className={
        classNames({
          [classes[variant]]: true,
          [classes.fullWidth]: fullWidth
        })
      }
      message={
        <span className={classes.content}>
          <Icon className={classNames(classes.icon, classes[`${variant}Icon`])} size={20} />
          <span className={classes.message}>
            {message}
          </span>
        </span>
      }
      action={action}
    />
  )
}

SnackbarContent.propTypes = {
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'loading']).isRequired,
  message: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  fullWidth: PropTypes.bool
}

SnackbarContent.defaultProps = {
  fullWidth: false
}

export default React.memo(withStyles(styles)(SnackbarContent))
