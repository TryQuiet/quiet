import React from 'react'

import classNames from 'classnames'

import { makeStyles } from '@material-ui/core/styles'
import MaterialSnackbar from '@material-ui/core/Snackbar'

import SnackbarContent from './SnackbarContent'

const useStyles = makeStyles(() => ({
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
}))

interface SnackbarProps {
  open: boolean
  message: string
  variant: 'success' | 'warning' | 'error' | 'info' | 'loading'
  position?: {
    vertical: 'bottom' | 'top'
    horizontal: 'left' | 'right'
  }
  fullWidth?: boolean
  onClose?: () => void
}

export const Snackbar: React.FC<SnackbarProps> = ({
  open,
  message,
  variant,
  onClose,
  position = { vertical: 'bottom', horizontal: 'left' },
  fullWidth = false
}) => {
  const classes = useStyles({})
  return (
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
      }}>
      <SnackbarContent
        variant={variant}
        message={message}
        fullWidth={fullWidth}
        onClose={onClose}
      />
    </MaterialSnackbar>
  )
}

export default Snackbar
