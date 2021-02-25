/* eslint import/first: 0 */
import { mapStateToProps, mapDispatchToProps } from './Security'

import create from '../../../store/create'

describe('Security', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      whitelist: {
        allowAll: false,
        whitelisted: ['test1', 'test2'],
        autoload: ['test3', 'test4']
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
