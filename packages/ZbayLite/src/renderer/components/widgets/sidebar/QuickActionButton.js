import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

const styles = theme => ({
  button: {
    marginTop: 8,
    padding: 0,
    marginLeft: 16,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1
    },
    opacity: 0.7,
    color: theme.palette.colors.white
  },
  icon: {
    fontSize: 14,
    marginRight: 5,
    marginBottom: 2
  }
})

export const QuickActionButton = ({ classes, text, action }) => (
  <Button variant='text' className={classes.button} onClick={action}>
    <AddIcon className={classes.icon} />
    <Typography variant='body2'>{text}</Typography>
  </Button>
)

QuickActionButton.propTypes = {
  classes: PropTypes.object.isRequired,
  text: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired
}

export default R.compose(
  withStyles(styles),
  React.memo
)(QuickActionButton)
