import { useTheme } from '@mui/material'
import { Titlebar, Color } from 'custom-electron-titlebar'

import { lightTheme as theme } from '../theme'

export const addTitlebar = () => {
  setTimeout(() => {
    // eslint-disable-next-line
    const titlebar = new Titlebar({
      backgroundColor: Color.fromHex(theme.palette.primary.main),
      overflow: 'hidden',
    })
  }, 0)
}
