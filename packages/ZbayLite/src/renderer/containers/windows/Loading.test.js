/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps } from './Loading'
import create from '../../store/create'
import { IdentityState } from '../../store/handlers/identity'
import { LoaderState } from '../../store/handlers/utils'

describe('Loading', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          loader: LoaderState({ loading: false })
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
