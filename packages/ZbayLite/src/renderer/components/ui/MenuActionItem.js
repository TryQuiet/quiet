import React from 'react'
import * as R from 'ramda'

import MuiMenuItem from '@material-ui/core/MenuItem'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    height: 8,
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5),
    fontSize: '0.75rem'
  }
})

export const MenuActionItem = ({ classes, onClick, title, close }) => {
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
