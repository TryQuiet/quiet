import React from 'react'
import { Typography as MuiTypography } from '@mui/material'

export const Typography: React.FC<React.ComponentProps<typeof MuiTypography>> = props => {
  return <MuiTypography {...props} />
}
