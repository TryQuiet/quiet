/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps } from './DirectMessagesInfoModal'

import create from '../../../store/create'

describe('ChannelInfoModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        directMessageChannel: {
          targetRecipientAddress:
            'ztestsapling18qgdx9qtwyrawas5yc9mcm7wrx6ukn5unkdkz3dryufum2gjnt8me2kql6nvhca3vdv2704ud4t',
          targetRecipientUsername: 'TEST'
        }
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
