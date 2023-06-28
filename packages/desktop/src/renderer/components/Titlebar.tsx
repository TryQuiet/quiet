import { Titlebar, Color } from 'custom-electron-titlebar'

export const addTitlebar = () => {
  setTimeout(() => {
    // eslint-disable-next-line
    const titlebar = new Titlebar({
      backgroundColor: Color.fromHex('#521c74'),
      overflow: 'hidden',
    })
  }, 0)
}
