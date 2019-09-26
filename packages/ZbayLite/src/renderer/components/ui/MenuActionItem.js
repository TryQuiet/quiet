import React from 'react'
import * as R from 'ramda'

import MuiMenuItem from '@material-ui/core/MenuItem'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    minHeight: 25,
    margin: 0,
    fontSize: 14,
    letterSpacing: 0.4,
    paddingTop: 5,
    paddingBottom: 5
  }
})

export const MenuActionItem = ({ classes, className, onClick, title, close }) => {
  return (
    <MuiMenuItem
      onClick={e => {
        onClick(e)
        close()
      }}
      className={classes.root}
      key={title}
    >
      {title}
    </MuiMenuItem>
  )
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(MenuActionItem)
