import React from 'react'

import { Grid as MuiGrid } from '@mui/material'

export const Grid: React.FC<React.ComponentProps<typeof MuiGrid>> = props => {
  return <MuiGrid {...props} />
}

export default Grid
