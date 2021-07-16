import { mapStateToProps } from './NodePanelFreeUtxos'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/identity'

describe('NodePanelFreeUtxos', () => {
  let store = null
  beforeEach(() => {
    store = create({
      identity: {
        ...initialState,
        data: { freeUtxos: 5 }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
