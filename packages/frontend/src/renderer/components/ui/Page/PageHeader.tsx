import React, { ReactElement } from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.palette.colors.white,
    order: -1,
    zIndex: 10,
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  }
}))

interface PageHeaderProps {
  children: ReactElement
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  const classes = useStyles({})
  return (
    <Grid item className={classes.root}>
      {children}
    </Grid>
  )
}

export default PageHeader
