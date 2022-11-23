import React from 'react'
import { styled } from '@mui/material/styles';
import classNames from 'classnames'

import MuiTab from '@mui/material/Tab'
import { makeStyles } from '@mui/material/styles'

const PREFIX = 'Tab';

const classes = {
  tabRoot: `${PREFIX}-tabRoot`,
  textColorPrimary: `${PREFIX}-textColorPrimary`,
  selected: `${PREFIX}-selected`
};

const StyledMuiTab
 = styled(MuiTab
)((
  {
    theme
  }
) => ({
  [`& .${classes.tabRoot}`]: {
    textTransform: 'initial',
    color: theme.typography.subtitle1.color
  },

  [`& .${classes.textColorPrimary}`]: {
    '&$selected': {
      color: theme.palette.colors.purple
    },
    '&$disabled': {
      color: theme.palette.colors.darkGrey
    }
  },

  [`& .${classes.selected}`]: {
    color: theme.palette.colors.purple
  }
}));

export const Tab: React.FC<React.ComponentProps<typeof MuiTab>> = props => {

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
