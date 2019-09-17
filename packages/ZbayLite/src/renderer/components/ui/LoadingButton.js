import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'

const styles = theme => ({
  button: {
    minWidth: 150,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  progress: {
    color: theme.palette.colors.white
  }
})

export const LoadingButton = ({ classes, inProgress, ...other }) => {
  if (inProgress) {
    return (
      <Button className={classes.button} {...other}>
        <CircularProgress className={classes.progress} />
      </Button>
    )
  } else {
    return (
      <Button className={classes.button} {...other} >
        Continue
      </Button>
    )
  }
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
