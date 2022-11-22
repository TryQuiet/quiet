import React, { ReactElement } from 'react'

import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'

const useStyles = makeStyles(theme => ({
  root: {
    background: theme.palette.colors.white,
    order: -1,
    zIndex: 10
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
