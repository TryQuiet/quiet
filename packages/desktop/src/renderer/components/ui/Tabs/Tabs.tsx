import React from 'react'
import { styled } from '@mui/material/styles'
import MuiTab from '@mui/material/Tab'
import MuiTabs from '@mui/material/Tabs'

const PREFIX = 'Tab'

const classes = {
  tabRoot: `${PREFIX}tabRoot`,
  textColorPrimary: `${PREFIX}textColorPrimary`,
  selected: `${PREFIX}selected`,
}

const StyledMuiTab = styled(MuiTab)(({ theme }) => ({
  [`&.${classes.tabRoot}`]: {
    opacity: '1',
    padding: '10px 8px 8px 8px',
    fontSize: '14px',
    fontWeight: '400',
    alignItems: 'flex-start',
    textTransform: 'none',
    lineHeight: '21px',
    minHeight: '0px',
  },

  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 5,
  },
}))

export const Tab: React.FC<React.ComponentProps<typeof MuiTab>> = props => {
  return (
    <StyledMuiTab
      classes={{
        root: classes.tabRoot,
        textColorPrimary: classes.textColorPrimary,
        selected: classes.selected,
      }}
      {...props}
    />
  )
}

export const Tabs: React.FC<React.ComponentProps<typeof MuiTabs>> = props => {
  return <MuiTabs {...props} />
}
