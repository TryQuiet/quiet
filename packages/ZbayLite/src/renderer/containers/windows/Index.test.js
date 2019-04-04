/* eslint import/first: 0 */
jest.mock('../../vault')
import { mapStateToProps } from './Index'

import create from '../../store/create'
import vaultHandlers from '../../store/handlers/vault'

describe('Index', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
  })

  it('will receive right props', async () => {
    await store.dispatch(vaultHandlers.actions.unlockVault())
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
