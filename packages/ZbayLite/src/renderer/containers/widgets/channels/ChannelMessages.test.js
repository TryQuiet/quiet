/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import { mapStateToProps } from './ChannelMessages'

import { createMessage } from '../../../components/widgets/channels/testUtils'
import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'

describe('ChannelInput', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          name: 'Politics',
          members: new BigNumber(0),
          message: 'This is a test message',
          messages: R.range(0, 4).map(createMessage)
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
