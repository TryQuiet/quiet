import React from 'react'
import { styled } from '@mui/material/styles'
import MuiTab from '@mui/material/Tab'

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
    backgroundColor: theme.palette.colors.lushSky,
    borderRadius: 5,
    color: `${theme.palette.colors.white} !important`,
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

export default Tab
