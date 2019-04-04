/* eslint import/first: 0 */
jest.mock('../../vault')
import { mapStateToProps } from './UnlockVault'

import create from '../../store/create'

describe('UnlockVault', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
