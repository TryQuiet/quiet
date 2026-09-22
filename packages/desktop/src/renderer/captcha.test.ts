import fs from 'fs'
import path from 'path'

describe('hCaptcha desktop input surface', () => {
  it('opts the page and challenge container out of the frameless window drag region', () => {
    const html = fs.readFileSync(path.join(__dirname, 'captcha.html'), 'utf8')

    expect(html).toMatch(/body\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/\.screen\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/\.captcha-container\s*{[^}]*-webkit-app-region:\s*no-drag/s)
    expect(html).toMatch(/body::before\s*{[^}]*height:\s*25px[^}]*-webkit-app-region:\s*drag/s)
  })
})
