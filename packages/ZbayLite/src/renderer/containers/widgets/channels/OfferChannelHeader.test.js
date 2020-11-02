import { mapStateToProps } from './OfferChannelHeader'

import create from '../../../store/create'

describe('OfferChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        offers: {
          address123: {
            name: 'testname'
          }
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState(), { offer: 'address123' })
    expect(props).toMatchSnapshot()
  })
})
