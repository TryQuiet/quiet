import selectors from './app'
import { initialState as AppState } from '../handlers/app'

import create from '../create'
import { Store } from '../../sagas/store.types'

describe('app -', () => {
    let store: Store | null = null
    beforeEach(() => {
        jest.clearAllMocks()
        store = create({
            app: {
                ...AppState,
                version: '0.13.37',
                transfers: {},
                modalTabToOpen: 'addFunds',
                allTransfersCount: 12,
                newTransfersCounter: 2,
            },
        })
    })

    it('version selector', async () => {
        const state = store?.getState()
        expect(state).not.toBeUndefined()
        if (!state) return
        expect(selectors.version(state)).toMatchSnapshot()
    })
})
