import { styled, Switch, SwitchProps } from '@mui/material'
import React from 'react'

/**
 * Modified from https://v5.mui.com/material-ui/react-switch/#customization to match the design
 * library's Toggle (Figma 0j7Nna9zWmfOSNmRmQK1Uh, "Toggle"): 52 x 32 with a 28 knob, off on
 * #F0F0F0 inside a 2px #E5E5E5 hairline, on in #80B857, and a white knob outlined at 0.5px.
 */
const TOGGLE_OFF = '#F0F0F0'
const TOGGLE_OFF_BORDER = '#E5E5E5'
const TOGGLE_ON = '#80B857'

export const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName='.Mui-focusVisible' disableRipple {...props} />
))(({ theme }) => ({
  width: 52,
  height: 32,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: TOGGLE_ON,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 28,
    height: 28,
    border: '0.5px solid rgba(0, 0, 0, 0.2)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 32 / 2,
    backgroundColor: TOGGLE_OFF,
    border: `2px solid ${TOGGLE_OFF_BORDER}`,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}))

export default IOSSwitch
