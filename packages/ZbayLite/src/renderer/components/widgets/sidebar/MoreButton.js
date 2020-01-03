import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

import Tooltip from '../../ui/Tooltip'

const styles = theme => ({
  button: {
    padding: 0,
    paddingLeft: 16,
    textTransform: 'none',
    textAlign: 'left',
    justifyContent: 'start',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.08)',
      opacity: 1
    },
    opacity: 0.7,
    color: theme.palette.colors.white
  },
  tooltip: {
    marginTop: 5
  }
})

export const MoreButton = ({ classes, tooltipText, action }) => (
  <Tooltip title={tooltipText} className={classes.tooltip} placement='bottom'>
    <Button
      fullWidth
      variant='text'
      className={classes.button}
      onClick={action}
    >
      <Typography variant='body2'>more...</Typography>
    </Button>
  </Tooltip>
)

MoreButton.propTypes = {
  classes: PropTypes.object.isRequired,
  tooltipText: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired
}

export default R.compose(withStyles(styles), React.memo)(MoreButton)
