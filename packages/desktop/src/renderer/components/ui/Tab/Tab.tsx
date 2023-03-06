import React from 'react'
import { styled } from '@mui/material/styles'
import MuiTab from '@mui/material/Tab'

const PREFIX = 'Tab'

const classes = {
  tabRoot: `${PREFIX}tabRoot`,
  textColorPrimary: `${PREFIX}textColorPrimary`,
  selected: `${PREFIX}selected`
}

const StyledMuiTab = styled(MuiTab)(({ theme }) => ({
  [`&.${classes.tabRoot}`]: {
    color: theme.typography.subtitle1.color,
    fontSize: '0.8125rem',
    alignItems: 'flex-start',
    textTransform: 'capitalize'
  },

  [`&.${classes.textColorPrimary}`]: {
    '& .selected': {
      color: theme.palette.colors.purple
    },
    '& .disabled': {
      color: theme.palette.colors.darkGrey
    }
  },

  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.colors.lushSky,
    borderRadius: 5,
    color: `${theme.palette.colors.white} !important`
  }
}))

export const Tab: React.FC<React.ComponentProps<typeof MuiTab>> = props => {
  return (
    <StyledMuiTab
      classes={{
        root: classes.tabRoot,
        textColorPrimary: classes.textColorPrimary,
        selected: classes.selected
      }}
      {...props}
    />
  )
}

export default Tab
