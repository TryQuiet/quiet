import { mapStateToProps } from './SyncLoader'
import create from '../../store/create'

jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))

describe('SyncLoader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({

    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
