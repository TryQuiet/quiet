import { combineReducers, createStore, Store } from '@reduxjs/toolkit'
import { modalsReducer, ModalsInitialState } from './modals.slice'
import { modalsSelectors } from './modals.selectors'
import { ModalName } from './modals.types'

describe('modalsSelectors', () => {
    let store: Store
    it('returns false for closed modal', () => {
        store = createStore(
            combineReducers({
                Modals: modalsReducer,
            }),
            {
                Modals: {
                    ...new ModalsInitialState(),
                },
            }
        )
        const channelInfo = modalsSelectors.open(ModalName.channelInfo)(store.getState())
        expect(channelInfo).toBe(false)
    })

    it('returns true for open modal', () => {
        store = createStore(
            combineReducers({
                Modals: modalsReducer,
            }),
            {
                Modals: {
                    ...new ModalsInitialState(),
                    [ModalName.channelInfo]: { open: true, args: {} },
                },
            }
        )
        const channelInfo = modalsSelectors.open(ModalName.channelInfo)(store.getState())
        expect(channelInfo).toBe(true)
    })
})
