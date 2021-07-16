import { mapStateToProps } from './NodeStatus'

import create from '../../../store/create'

describe('NodeStatus', () => {
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
