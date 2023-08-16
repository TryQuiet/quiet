import { getFilesData } from './fileData'

describe('fileData ', () => {
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
