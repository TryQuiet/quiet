"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toolkit_1 = require("@reduxjs/toolkit");
const modals_slice_1 = require("./modals.slice");
const modals_selectors_1 = require("./modals.selectors");
const modals_types_1 = require("./modals.types");
describe('modalsSelectors', () => {
    let store;
    it('returns false for closed modal', () => {
        store = (0, toolkit_1.createStore)((0, toolkit_1.combineReducers)({
            Modals: modals_slice_1.modalsReducer
        }), {
            Modals: Object.assign({}, new modals_slice_1.ModalsInitialState())
        });
        const channelInfo = modals_selectors_1.modalsSelectors.open(modals_types_1.ModalName.channelInfo)(store.getState());
        expect(channelInfo).toBe(false);
    });
    it('returns true for open modal', () => {
        store = (0, toolkit_1.createStore)((0, toolkit_1.combineReducers)({
            Modals: modals_slice_1.modalsReducer
        }), {
            Modals: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.channelInfo]: { open: true } })
        });
        const channelInfo = modals_selectors_1.modalsSelectors.open(modals_types_1.ModalName.channelInfo)(store.getState());
        expect(channelInfo).toBe(true);
    });
});
