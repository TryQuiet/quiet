import React from 'react'
import * as R from 'ramda'

import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import AddIcon from '@material-ui/icons/Add'

const styles = {
  icon: {
    fontSize: '26px'
  },
  button: {
    padding: '4px'
  }
}

export const CreateChannelModal = ({ classes, openModal }) => (
  <IconButton color='inherit' onClick={openModal} className={classes.button}>
    <AddIcon fontSize='inherit' className={classes.icon} />
  </IconButton>
)

export default R.compose(
  withStyles(styles),
  React.memo
)(CreateChannelModal)
