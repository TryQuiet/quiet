import React, { ReactElement } from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'

const PREFIX = 'PageHeader'

const classes = {
  root: `${PREFIX}root`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`&.${classes.root}`]: {
    background: theme.palette.colors.white,
    order: -1,
    zIndex: 9
  }
}))

interface PageHeaderProps {
  children: ReactElement
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children }) => {
  return (
    <StyledGrid item className={classes.root}>
      {children}
    </StyledGrid>
  )
}

export default PageHeader
