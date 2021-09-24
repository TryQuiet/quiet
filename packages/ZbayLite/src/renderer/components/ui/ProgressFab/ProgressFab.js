import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import Fab from '@material-ui/core/Fab'
import CircularProgress from '@material-ui/core/CircularProgress'
import green from '@material-ui/core/colors/green'
import CheckIcon from '@material-ui/icons/Check'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    backgroundColor: '#8d8d8d',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#737373'
    }
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    left: -6,
    top: -6,
    zIndex: 1
  },
  wrapper: {
    position: 'relative'
  },
  buttonSuccess: {
    '&:disabled': {
      backgroundColor: green[500],
      color: '#fff'
    }
  }
})

export const ProgressFab = ({
  classes,
  className,
  children,
  loading,
  success,
  disabled,
  onClick,
  ...props
}) => (
  <div className={
    classNames({
      [classes.wrapper]: true,
      [className]: className
    })
  }>
    <Fab
      classes={{
        root: classNames({
          [classes.root]: true,
          [classes.buttonSuccess]: success
        })
      }}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {success ? <CheckIcon /> : children }
    </Fab>
    {loading && <CircularProgress size={68} className={classes.fabProgress} />}
  </div>
)

ProgressFab.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  children: PropTypes.element.isRequired,
  loading: PropTypes.bool.isRequired,
  success: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func
}

ProgressFab.defaultProps = {
  loading: false,
  success: false,
  disabled: false
}

export default React.memo(withStyles(styles)(ProgressFab))
