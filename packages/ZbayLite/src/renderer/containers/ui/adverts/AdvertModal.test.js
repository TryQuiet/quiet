/* eslint import/first: 0 */
import { mapStateToProps, mapDispatchToProps } from './AdvertModal'

import create from '../../../store/create'

describe('AdvertModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        rates: {
          usd: '10',
          zec: '1'
        },
        identity: {
          data: {
            id: '1',
            address: 'test',
            name: 'Mars',
            balance: '2'
          }
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
