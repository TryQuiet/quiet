import React from 'react'

import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material'

type DrawerProps = MuiDrawerProps & { showHeader?: boolean }

export const Drawer: React.FC<DrawerProps> = ({ children, showHeader, ...otherProps }) => {
  return (
    <MuiDrawer {...otherProps}>
      {showHeader}
      {children}
    </MuiDrawer>
  )
}

export default Drawer
