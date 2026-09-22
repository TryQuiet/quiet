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
 *
 * Naming the panel: MUI puts its modal root at `role="presentation"`, which is not in the
 * accessibility tree, so an `aria-label`/`aria-labelledby` landing there names nothing. A caller
 * that passes one means the panel, so it is moved onto the Paper together with the dialog role
 * and `aria-modal` - the arrangement MUI's own Dialog uses. A caller that passes neither gets the
 * markup it always had.
 */
export const Drawer: React.FC<MuiDrawerProps> = ({ children, BackdropProps, PaperProps, ...otherProps }) => {
  const { 'aria-labelledby': labelledBy, 'aria-label': label, ...rest } = otherProps
  const named = Boolean(labelledBy ?? label)
  return (
    <MuiDrawer
      BackdropProps={{ invisible: true, ...BackdropProps }}
      PaperProps={
        named
          ? {
              role: 'dialog',
              'aria-modal': true,
              'aria-labelledby': labelledBy,
              'aria-label': label,
              ...PaperProps,
            }
          : PaperProps
      }
      {...rest}
    >
      {children}
    </MuiDrawer>
  )
}

export default Drawer
