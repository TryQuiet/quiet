import fs from 'fs'
import path from 'path'

describe('renderer title-bar drag surface', () => {
  it.each(['darwin', 'win32', 'linux'])('keeps application content outside the %s drag surface', platform => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
    document.body.innerHTML = html.match(/<body>([\s\S]*?)<\/body>/)![1]
    const script = document.body.querySelector('script')!
    new Function('document', 'process', script.textContent!)(document, { platform })
    const root = document.getElementById('root')!
    const drag = document.getElementById('title-bar-drag')!
    expect(root.parentElement).toBe(document.body)
    expect(drag.contains(root)).toBe(false)
    expect(drag.hidden).toBe(platform !== 'darwin')
  })
})
