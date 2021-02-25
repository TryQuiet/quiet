import { mapStateToProps, mapDispatchToProps } from './ErrorModal'

import create from '../../store/create'
import { CriticalError } from '../../store/handlers/criticalError'

describe('ErrorModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      criticalError: {
        ...CriticalError,
        message: 'Something failed',
        traceback: 'Error: something failed'
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
