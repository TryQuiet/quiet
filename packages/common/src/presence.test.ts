import { isDmConnected, isMemberConnected } from './presence'

const ME = 'me'
const online =
  (...ids: string[]) =>
  (userId: string | undefined) =>
    userId != null && ids.includes(userId)

describe('isMemberConnected', () => {
  it('follows the network for a remote member', () => {
    expect(isMemberConnected('bob', ME, online('bob'), false)).toBe(true)
    expect(isMemberConnected('bob', ME, online(), true)).toBe(false)
  })

  it('follows Tor for my own row, not remote presence', () => {
    // I am not my own peer, so `isUserConnected(me)` is not the question.
    expect(isMemberConnected(ME, ME, online(), true)).toBe(true)
    expect(isMemberConnected(ME, ME, online(ME), false)).toBe(false)
  })

  it('treats a missing user id as offline', () => {
    expect(isMemberConnected(undefined, ME, online(ME), true)).toBe(false)
  })

  it('does not apply the self rule when I am unknown', () => {
    expect(isMemberConnected('bob', undefined, online('bob'), false)).toBe(true)
    expect(isMemberConnected('bob', undefined, online(), true)).toBe(false)
  })
})

describe('isDmConnected', () => {
  it('follows the other person in a one-to-one', () => {
    expect(isDmConnected([ME, 'bob'], ME, online('bob'), true)).toBe(true)
    expect(isDmConnected([ME, 'bob'], ME, online(), true)).toBe(false)
  })

  it('does not count my own connection', () => {
    expect(isDmConnected([ME, 'bob'], ME, online(ME), true)).toBe(false)
  })

  it('follows ANY other participant in a group', () => {
    expect(isDmConnected([ME, 'bob', 'carol'], ME, online('carol'), true)).toBe(true)
    expect(isDmConnected([ME, 'bob', 'carol'], ME, online('bob'), true)).toBe(true)
    expect(isDmConnected([ME, 'bob', 'carol'], ME, online(), true)).toBe(false)
  })

  it('follows Tor for the conversation with myself', () => {
    expect(isDmConnected([ME], ME, online(), true)).toBe(true)
    expect(isDmConnected([ME], ME, online(ME), false)).toBe(false)
  })

  it('treats an unknown conversation or unknown self as offline', () => {
    expect(isDmConnected(undefined, ME, online('bob'), true)).toBe(false)
    expect(isDmConnected([ME, 'bob'], undefined, online('bob'), true)).toBe(false)
  })
})
