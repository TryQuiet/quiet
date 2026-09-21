import React from 'react'

import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material'

/**
 * The app's side panel.
 *
 * No scrim: the designs draw the panel as a white column over the right of the content area with
 * the rest of the window left alone — the sidebar stays at full strength beside it (Figma
 * BnANosC1KGMUvm8oU2Dr0i 813:4801, where the 375 panel sits inside the 520 content region and
 * nothing anywhere is dimmed). MUI darkens the whole window by default, which also dimmed the
 * sidebar, and panels had been opting out of it one at a time — so going a level deeper made the
 * darkening disappear. It is off here, once, for every panel.
 *
 * A caller that genuinely needs a scrim can still pass its own BackdropProps.
 */
export const Drawer: React.FC<MuiDrawerProps> = ({ children, BackdropProps, ...otherProps }) => {
  return (
    <MuiDrawer BackdropProps={{ invisible: true, ...BackdropProps }} {...otherProps}>
      {children}
    </MuiDrawer>
  )
}

export default Drawer
