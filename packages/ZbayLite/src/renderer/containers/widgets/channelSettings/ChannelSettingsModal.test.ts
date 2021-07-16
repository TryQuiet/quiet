/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './ChannelSettingsModal'

import { ChannelState } from '../../../store/handlers/channel'

import create from '../../../store/create'

const channelId = 'randomid'
const baseStore = {
  channel: {
    ...ChannelState,
    spentFilterValue: 38,
    id: channelId,
    shareableUri: 'testuri',
    members: new BigNumber(0),
    message: 'Message written in the input'
  }
}
describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      ...baseStore
    })
  })

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    expect(state).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
