/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapStateToProps } from './ChannelHeader'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'

describe('ChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          name: 'Politics',
          members: new BigNumber(0),
          message: '',
          messages: []
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
