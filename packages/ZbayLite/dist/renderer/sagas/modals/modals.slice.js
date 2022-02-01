"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", { value: true });
exports.modalsReducer = exports.modalsActions = exports.modalsSlice = exports.ModalsInitialState = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const modals_types_1 = require("./modals.types");
class ModalsInitialState {
    constructor() {
        this[_a] = { open: false };
        this[_b] = { open: false };
        this[_c] = { open: false };
        this[_d] = { open: false };
        this[_e] = { open: false };
        this[_f] = {
            open: false,
            args: undefined
        };
        this[_g] = { open: false };
        this[_h] = { open: false };
        this[_j] = { open: false };
        this[_k] = { open: false };
        this[_l] = { open: false };
        this[_m] = { open: false };
        this[_o] = { open: false };
        this[_p] = { open: false };
        this[_q] = { open: false };
        this[_r] = {
            open: false,
            args: undefined
        };
    }
}
exports.ModalsInitialState = ModalsInitialState;
_a = modals_types_1.ModalName.applicationUpdate, _b = modals_types_1.ModalName.createChannel, _c = modals_types_1.ModalName.accountSettingsModal, _d = modals_types_1.ModalName.openexternallink, _e = modals_types_1.ModalName.criticalError, _f = modals_types_1.ModalName.createUsernameModal, _g = modals_types_1.ModalName.channelInfo, _h = modals_types_1.ModalName.channelSettingsModal, _j = modals_types_1.ModalName.publishChannel, _k = modals_types_1.ModalName.joinChannel, _l = modals_types_1.ModalName.newMessageSeparate, _m = modals_types_1.ModalName.quitApp, _o = modals_types_1.ModalName.joinCommunityModal, _p = modals_types_1.ModalName.createCommunityModal, _q = modals_types_1.ModalName.sentryWarningModal, _r = modals_types_1.ModalName.loadingPanel;
exports.modalsSlice = (0, toolkit_1.createSlice)({
    initialState: Object.assign({}, new ModalsInitialState()),
    name: 'Modals',
    reducers: {
        openModal: (state, action) => {
            const name = action.payload.name;
            const args = action.payload.args;
            state[name].open = true;
            if (args)
                state[name].args = args;
        },
        closeModal: (state, action) => {
            state[action.payload].open = false;
            state[action.payload].args = undefined;
        }
    }
});
exports.modalsActions = exports.modalsSlice.actions;
exports.modalsReducer = exports.modalsSlice.reducer;
