import { getFilesData } from './fileData'

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
})
