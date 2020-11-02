/* eslint import/first: 0 */
import { mapStateToProps } from './Loading'
import create from '../../store/create'
import { initialState } from '../../store/handlers/identity'

describe('Loading', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        identity: {
          ...initialState,
          loader: { loading: false }
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
