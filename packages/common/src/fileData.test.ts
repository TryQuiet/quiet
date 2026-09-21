import { decodeFileName, getFilesData } from './fileData'

describe('fileData ', () => {
  it('preserves separate selections and removals even in the same clock tick', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(123456789)
    const random = jest.spyOn(Math, 'random').mockReturnValue(0)
    try {
      const first = getFilesData([{ path: 'photos/first.jpg' }, { path: 'photos/second.jpg' }])
      const second = getFilesData([{ path: 'photos/first.jpg' }])
      const previews = { ...first, ...second }
      expect(Object.values(previews).map(file => file.path)).toEqual([
        'photos/first.jpg',
        'photos/second.jpg',
        'photos/first.jpg',
      ])
      delete previews[Object.keys(first)[0]]
      expect(Object.values(previews).map(file => file.path)).toEqual(['photos/second.jpg', 'photos/first.jpg'])
    } finally {
      clock.mockRestore()
      random.mockRestore()
    }
  })

  it('should return proper FilePreviewData', () => {
    const result = getFilesData([{ path: 'path/to/file.png', isTmp: true }, { path: 'path/to/document.pdf' }])
    expect(Object.values(result)).toEqual([
      {
        path: 'path/to/file.png',
        tmpPath: 'path/to/file.png',
        name: 'file',
        ext: '.png',
      },
      {
        path: 'path/to/document.pdf',
        tmpPath: undefined,
        name: 'document',
        ext: '.pdf',
      },
    ])
  })

  // https://github.com/TryQuiet/quiet/issues/1701
  it('should percent-decode names derived from mobile picker URIs', () => {
    const uri = 'file:///data/user/0/com.quiet.mobile/cache/My%20File.pdf'
    const result = getFilesData([{ path: uri, isTmp: true }])
    expect(Object.values(result)).toEqual([
      {
        // the raw URI is kept - sendFileMessageSaga decodes it before reading from disk
        path: uri,
        tmpPath: uri,
        name: 'My File',
        ext: '.pdf',
      },
    ])
  })

  it('should decode an encoded percent sign in a picker URI', () => {
    const result = getFilesData([{ path: 'file:///cache/100%25%20off.txt' }])
    expect(Object.values(result)[0]).toMatchObject({ name: '100% off', ext: '.txt' })
  })

  it('should leave a malformed percent sequence untouched', () => {
    const result = getFilesData([{ path: 'file:///cache/%E0%A4%A.txt' }])
    expect(Object.values(result)[0]).toMatchObject({ name: '%E0%A4%A', ext: '.txt' })
  })

  // Desktop hands us plain OS paths, never percent-encoded - they must survive untouched.
  it('should not alter a desktop path whose name contains spaces', () => {
    const filePath = '/home/user/Documents/My File.pdf'
    const result = getFilesData([{ path: filePath }])
    expect(Object.values(result)).toEqual([
      {
        path: filePath,
        tmpPath: undefined,
        name: 'My File',
        ext: '.pdf',
      },
    ])
  })

  it('should not alter a desktop path whose name contains a literal percent sign', () => {
    const result = getFilesData([{ path: '/home/user/Documents/100%.txt' }])
    expect(Object.values(result)[0]).toMatchObject({ name: '100%', ext: '.txt' })
  })
})

describe('decodeFileName', () => {
  it.each([
    ['My%20File.pdf', 'My File.pdf'],
    ['100%25.txt', '100%.txt'],
    ['%E0%A4%A', '%E0%A4%A'],
    ['plain name.txt', 'plain name.txt'],
    ['report.pdf', 'report.pdf'],
    ['100%.txt', '100%.txt'],
    ['', ''],
  ])('decodes %p to %p', (input, expected) => {
    expect(decodeFileName(input)).toEqual(expected)
  })
})
