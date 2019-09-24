import React from 'react'
import * as R from 'ramda'

import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import MenuAction from '../../ui/MenuAction'
import addIcon from '../../../static/images/zcash/add-icon.svg'

const styles = theme => ({
  icon: {
    width: 15,
    height: 15
  },
  button: {
    width: 25,
    height: 25,
    padding: 4,
    color: theme.typography.body2.color,
    backgroundColor: 'rgb(0,0,0,0.26)',
    borderRadius: '50%'
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
        icon={addIcon}
        iconHover={addIcon}
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
