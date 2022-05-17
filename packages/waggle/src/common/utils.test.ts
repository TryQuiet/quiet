import mock from 'mock-fs'
import path from 'path'
import { getFilesRecursively, removeFiles, getDirsRecursively,removeDirs } from './utils'

beforeEach(() => {
  mock({
    Quiet: {
      'some-file.txt': 'file content here',
      IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn: {
        pins: {
          LOCK: 'some data'
        },
        'repo.lock': {}
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

describe('Get files and dirs', () => {
  let arr = []
  it('Get files recursively', () => {
    getFilesRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins/LOCK',
      'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/LOCK',
      'Quiet/some-file.txt'
    ])
  })

  it('Get dirs recursively', () => {
    arr = []
    getDirsRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn',
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins',
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/repo.lock',
      'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn'
    ])
  })

  it("Returns empty array if directory doesn't exist", () => {
    arr = []
    getFilesRecursively('Delta', arr)
    expect(arr).toEqual([])
  })
})

describe('Remove files and dirs', () => {
  it('Remove files by name', () => {
    let arr = []
    getFilesRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins/LOCK',
      'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/LOCK',
      'Quiet/some-file.txt'
    ])
    removeFiles('Quiet', 'LOCK')
    arr = []
    getFilesRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/some-file.txt'
    ])
  })

  it('Remove directories by name', () => {
    let arr = []
    getDirsRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn',
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins',
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/repo.lock',
      'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn'
    ])
    removeDirs('Quiet', 'repo.lock')
    arr = []
    getDirsRecursively('Quiet', arr)
    arr = arr.map(e => e.split(path.sep).join(path.posix.sep))
    expect(arr).toEqual([
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn',
      'Quiet/IpfsQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn/pins',
      'Quiet/OrbitDBQmQ18tV1dfGsEH8sCnbnzaYpMpb1QyCEjJ2KW96YtZ2MUn'
    ])
  })
  it("No error if directory doesn't exist", () => {
    expect(() => removeFiles('LOCK', 'non/existent/dir')).not.toThrow()
  })
})
