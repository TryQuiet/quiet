jest.mock('electron', () => {
    // @ts-expect-error
    const ipcRenderer = jest.mock()
    // @ts-expect-error
    ipcRenderer.on = jest.fn().mockReturnValue('ok')
    return { ipcRenderer }
})

jest.mock('@electron/remote', () => {
    // @ts-expect-error
    const remote = jest.mock()
    // @ts-expect-error
    remote.app = jest.mock()
    // @ts-expect-error
    remote.app.getName = jest.fn().mockReturnValue('Quiet')
    // @ts-expect-error
    remote.process = jest.mock()
    // @ts-expect-error
    remote.process.on = jest.fn()
    // @ts-expect-error
    remote.app.getVersion = jest.fn().mockReturnValue('0.13.37')
    return remote
})

import remote from '@electron/remote'

import handlers from './app'
import selectors from '../selectors/app'
import create from '../create'
import { Store } from '../../sagas/store.types'

describe('criticalError reducer', () => {
    let store: Store | null = null
    beforeEach(() => {
        store = create({
            initialState: {
                app: {},
            },
        })
        jest.clearAllMocks()
    })

    describe('handles actions -', () => {
        it('loadVersion', () => {
            store?.dispatch(handlers.actions.loadVersion())
            const state = store?.getState()
            expect(state).not.toBeUndefined()
            if (!state) return
            expect(selectors.version(state)).toMatchSnapshot()
        })
    })
})
