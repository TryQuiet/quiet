import React from 'react'
import classNames from 'classnames'

import MuiTab from '@material-ui/core/Tab'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  tabRoot: {
    textTransform: 'initial',
    color: theme.typography.subtitle1.color
  },
  textColorPrimary: {
    '&$selected': {
      color: theme.palette.colors.purple
    },
    '&$disabled': {
      color: theme.palette.colors.darkGrey
    }
  },
  selected: {
    color: theme.palette.colors.purple
  }
})

export const Tab = ({ classes, ...props }) => {
  return (
    <MuiTab
      classes={{
        root: classNames({
          [classes.tabRoot]: true
        }),
        textColorPrimary: classes.textColorPrimary,
        selected: classes.selected
      }}
      {...props} />
  )
}

export default withStyles(styles)(Tab)
