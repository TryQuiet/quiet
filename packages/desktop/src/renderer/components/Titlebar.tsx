import { useTheme } from '@mui/material'
import { Titlebar, Color } from 'custom-electron-titlebar'

import { getTheme } from '../theme'

export const addTitlebar = () => {
  const theme = getTheme()
  setTimeout(() => {
    // eslint-disable-next-line
    const titlebar = new Titlebar({
      backgroundColor: Color.fromHex(theme.palette.primary.main),
      overflow: 'hidden',
    })
  }, 0)
}
