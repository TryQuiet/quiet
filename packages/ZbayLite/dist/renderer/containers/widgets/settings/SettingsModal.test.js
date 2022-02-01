"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
require("@testing-library/jest-dom/extend-expect");
const dom_1 = require("@testing-library/dom");
const prepareStore_1 = require("../../../testUtils/prepareStore");
const renderComponent_1 = require("../../../testUtils/renderComponent");
const SettingsModal_1 = __importDefault(require("./SettingsModal"));
const modals_slice_1 = require("../../../sagas/modals/modals.slice");
const modals_types_1 = require("../../../sagas/modals/modals.types");
describe('SettingsModal', () => {
    it("doesn't break if there's no community yet", () => __awaiter(void 0, void 0, void 0, function* () {
        const { store } = yield (0, prepareStore_1.prepareStore)();
        store.dispatch(modals_slice_1.modalsActions.openModal({ name: modals_types_1.ModalName.accountSettingsModal }));
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(SettingsModal_1.default, null)), store);
        const modalTitle = dom_1.screen.getByText('Settings');
        expect(modalTitle).toBeVisible();
    }));
});
