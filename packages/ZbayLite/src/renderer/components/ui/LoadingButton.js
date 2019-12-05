import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import classNames from 'classnames'

const styles = theme => ({
  button: {
    maxWidth: 286,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.darkGray,
      opacity: 0.7
    }
  },
  inProgress: {
    '&:disabled': {
      backgroundColor: theme.palette.colors.zbayBlue,
      opacity: 1
    }
  },
  progress: {
    color: theme.palette.colors.white
  }
})

export const LoadingButton = ({ classes, inProgress, text, ...other }) => {
  return inProgress ? (
    <Button
      className={classNames({ [classes.button]: true, [classes.inProgress]: true })}
      {...other}
    >
      <CircularProgress className={classes.progress} />
    </Button>
  ) : (
    <Button className={classes.button} {...other}>
      {text || 'Continue'}
    </Button>
  )
}

LoadingButton.defaultProps = {
  inProgress: false
}

LoadingButton.propTypes = {
  classes: PropTypes.object.isRequired,
  inProgress: PropTypes.bool,
  finished: PropTypes.bool
}

export default withStyles(styles)(LoadingButton)
