import React from 'react'
import classNames from 'classnames'

import MuiTab from '@mui/material/Tab'
import { makeStyles } from '@mui/material/styles'

const useStyles = makeStyles(theme => ({
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
}))

export const Tab: React.FC<React.ComponentProps<typeof MuiTab>> = props => {
  const classes = useStyles({})
  return (
    <MuiTab
      classes={{
        root: classNames({
          [classes.tabRoot]: true
        }),
        textColorPrimary: classes.textColorPrimary,
        selected: classes.selected
      }}
      {...props}
    />
  )
}

export default Tab
