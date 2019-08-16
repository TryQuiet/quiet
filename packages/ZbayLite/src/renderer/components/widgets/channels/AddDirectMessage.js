import React from 'react'
import * as R from 'ramda'

import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import AddIcon from '@material-ui/icons/Add'

import MenuAction from '../../ui/MenuAction'

const styles = theme => ({
  icon: {
    fontSize: 26
  },
  button: {
    padding: 4,
    color: theme.typography.body2.color
  }
})

export const AddDirectMessage = ({ classes, openModal }) => {
  return (
    <React.Fragment>
      <MenuAction
        classes={{
          button: classes.button,
          icon: classes.icon
        }}
        Icon={AddIcon}
        IconButton={IconButton}
        offset='0 8'
        onClick={openModal}
      />
    </React.Fragment>
  )
}

export default R.compose(
  withStyles(styles),
  React.memo
)(AddDirectMessage)
