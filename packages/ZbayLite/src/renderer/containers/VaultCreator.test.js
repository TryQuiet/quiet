/* eslint import/first: 0 */
jest.mock('../vault')
import { mapStateToProps, mapDispatchToProps } from './VaultCreator'

import create from '../store/create'

describe('VaultCreator', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
