/* eslint import/first: 0 */
import selectors from './coordinator'
import { Coordinator } from '../handlers/coordinator'

import create from '../create'

describe('Cooordinator -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        ...Coordinator
      }
    })
  })

  it('Coordinator selector', async () => {
    expect(selectors.running(store.getState())).toMatchSnapshot()
  })
})
