import { Titlebar, TitlebarColor } from 'custom-electron-titlebar'

export const addTitlebar = () => {
  setTimeout(() => {
    // eslint-disable-next-line
    const titlebar = new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#521c74'),
      containerOverflow: 'hidden',
    })
  }, 0)
}
