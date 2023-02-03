import mock from 'mock-fs'
import path from 'path'
import { getFilesRecursively, removeFiles, getDirsRecursively, removeDirs, compare, getUsersAddresses, createLibp2pAddress } from './utils'
import { jest, beforeEach, describe, it, expect, afterEach, beforeAll } from '@jest/globals'

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

describe('Compare actual and reported file size', () => {
  it('Return true for equal sizes', () => {
    const res = compare(20400, 20400)
    expect(res).toBe(true)
  })

  it('Return true for value that fits in tolerance', () => {
    const res = compare(20400, 19800, 0.05)
    expect(res).toBe(true)
  })

  it("Return false for value that doesn't fit in tolerance", () => {
    const res = compare(20400, 19400, 0.05)
    expect(res).toBe(false)
  })
})

it('Gets users addresses based on user data', async () => {
  const userData = [
    { onionAddress: '12345.onion', peerId: '54321', dmPublicKey: '324530833893', username: 'Bob' },
    { onionAddress: '67890.onion', peerId: '09876', dmPublicKey: '098830987898', username: 'Alice' }
  ]
  const addresses = await getUsersAddresses(userData)
  expect(addresses).toStrictEqual([
    createLibp2pAddress(userData[0].onionAddress, userData[0].peerId),
    createLibp2pAddress(userData[1].onionAddress, userData[1].peerId)
  ])
})
