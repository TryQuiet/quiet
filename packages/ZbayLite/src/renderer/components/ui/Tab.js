import React from 'react'

import MuiTab from '@material-ui/core/Tab'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  tabRoot: {
    textTransform: 'initial',
    fontFamily: theme.typography.subtitle1.fontFamily,
    fontSize: '0.9rem',
    color: theme.typography.subtitle1.color
  }
})

export const Tab = ({ classes, ...props }) => (
  <MuiTab
    classes={{
      root: classes.tabRoot
    }}
    {...props} />
)

export default withStyles(styles)(Tab)
