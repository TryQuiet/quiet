/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './mentions'
import { ChannelMentions } from '../handlers/mentions'

import create from '../create'
const channelId1 = ' id1'
const channelId2 = ' id2'
describe('invitation -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        mentions: Immutable.Map({
          [channelId1]: [
            ChannelMentions({ nickname: 'test1', timeStamp: 1234567 }),
            ChannelMentions({ nickname: 'test2', timeStamp: 1234567 })
          ],
          [channelId2]: [
            ChannelMentions({ nickname: 'test3', timeStamp: 1234567 }),
            ChannelMentions({ nickname: 'test4', timeStamp: 1234567 })
          ]
        })
      })
    })
  })

  it('mentions selector', async () => {
    expect(selectors.mentions(store.getState())).toMatchSnapshot()
  })

  it('mentions selector channel 1', async () => {
    expect(
      selectors.mentionForChannel(channelId1)(store.getState())
    ).toMatchSnapshot()
  })
  it('mentions selector channel 2', async () => {
    expect(
      selectors.mentionForChannel(channelId1)(store.getState())
    ).toMatchSnapshot()
  })
})
