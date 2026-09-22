import fs from 'fs'
import path from 'path'
import { TITLE_BAR_DRAG_HEIGHT, windowDragRegion } from './components/windows/windowDragRegion'

describe('hCaptcha desktop input surface', () => {
  it('opts the page and challenge container out of the frameless window drag region', () => {
    const html = fs.readFileSync(path.join(__dirname, 'captcha.html'), 'utf8')

    expect(html).toMatch(/body\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/\.screen\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/\.captcha-container\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/body::before\s*{[^}]*height:\s*25px[^}]*-webkit-app-region:\s*drag/s)
  })

  it('limits the host renderer drag region beneath the BrowserView to the title bar', () => {
    expect(windowDragRegion('darwin')).toEqual({
      WebkitAppRegion: 'no-drag',
      '&::before': {
        content: '""',
        position: 'fixed',
        inset: '0 0 auto',
        height: TITLE_BAR_DRAG_HEIGHT,
        WebkitAppRegion: 'drag',
      },
    })
    expect(windowDragRegion('win32')).toEqual({ WebkitAppRegion: 'no-drag' })
  })
})
