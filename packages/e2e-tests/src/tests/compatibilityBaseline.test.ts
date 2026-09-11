import { compatibilityBaseline } from '../compatibilityBaseline'

describe('compatibility baseline', () => {
  it.each(['9.0.2', '10.0.0-alpha.1', '10.0.0', '10.0.0+build.1'])(
    'reopens the supplied %s build without downloading an unpublished baseline',
    version => {
      const download = jest.fn(() => 'released.AppImage')
      const fileName = `Quiet-${version}.AppImage`

      expect(compatibilityBaseline(version, fileName, download)).toEqual({
        isPlaceholder: true,
        version,
        fileName,
      })
      expect(download).not.toHaveBeenCalled()
    }
  )

  it.each(['10.0.1-alpha.0', '10.0.1', '10.1.0', '11.0.0'])(
    'requires the released 10.0.0 installer for %s',
    version => {
      const download = jest.fn(() => 'Quiet-10.0.0.AppImage')

      expect(compatibilityBaseline(version, `Quiet-${version}.AppImage`, download)).toEqual({
        isPlaceholder: false,
        version: '10.0.0',
        fileName: 'Quiet-10.0.0.AppImage',
      })
      expect(download).toHaveBeenCalledWith('10.0.0')
    }
  )

  it.each(['', '10', '10.0', 'not-a-version'])('rejects malformed build version %j', version => {
    const download = jest.fn()
    expect(() => compatibilityBaseline(version, 'current.AppImage', download)).toThrow('Invalid build version')
    expect(download).not.toHaveBeenCalled()
  })
})
