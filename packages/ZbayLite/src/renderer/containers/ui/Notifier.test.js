/* eslint import/first: 0 */

import { mapStateToProps, mapDispatchToProps } from './Notifier'

import create from '../../store/create'

describe('Notifier', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      // TODO: 07/05 change to Record
      notifications: [
        {
          message: 'Test message',
          key: 'test-key',
          options: {
            persist: true
          }
        }
      ]
    })
  })

  it('will receive right props', () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
