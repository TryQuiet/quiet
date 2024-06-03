import React from 'react'

import { Box as MuiBox, BoxProps as MuiBoxProps } from '@mui/material'

type BoxProps = MuiBoxProps

export const Box: React.FC<BoxProps> = props => {
  return <MuiBox {...props} />
}
