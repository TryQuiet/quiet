import mock from 'mock-fs'
import { getFilesRecursively, removeFiles } from './utils'

beforeEach(() => {
    mock({
      Quiet: {
        'some-file.txt': 'file content here',
        IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn: {
          pins: {
            LOCK: 'some data'
          }
        },
        OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn: {
          LOCK: 'some data'
        }
      },
      'some/empty/dir': {}
    })
})

afterEach(() => {
  mock.restore()
})

describe('Get files', () => {
    let arr = []
    it('Get files recursively', () => {
        getFilesRecursively('Quiet', arr)
        expect(arr).toEqual([
            'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins/LOCK',
            'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/LOCK',
            'Quiet/some-file.txt'
        ])
    })
})

describe('Remove files', () => {
    it('Remove files by name', () => {
        let arr = []
        getFilesRecursively('Quiet', arr)
        expect(arr).toEqual([
          'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins/LOCK',
          'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/LOCK',
          'Quiet/some-file.txt'
        ])
        removeFiles('Quiet', 'LOCK')
        arr = []
        getFilesRecursively('Quiet', arr)
        expect(arr).toEqual([
          'Quiet/some-file.txt'
        ])
    })
})