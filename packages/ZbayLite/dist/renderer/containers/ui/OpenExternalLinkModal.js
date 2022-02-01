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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOpenExternalLinkModalActions = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const electron_1 = require("electron");
const OpenlinkModal_1 = __importDefault(require("../../components/ui/OpenlinkModal/OpenlinkModal"));
const whitelist_1 = __importDefault(require("../../store/handlers/whitelist"));
const hooks_1 = require("../hooks");
const modals_types_1 = require("../../sagas/modals/modals.types");
const useOpenExternalLinkModalActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const addToWhitelist = (url) => dispatch(whitelist_1.default.epics.addToWhitelist(url, true));
    const setWhitelistAll = () => dispatch(whitelist_1.default.epics.setWhitelistAll(true));
    return { addToWhitelist, setWhitelistAll };
};
exports.useOpenExternalLinkModalActions = useOpenExternalLinkModalActions;
const OpenLinkModal = (_a) => {
    var rest = __rest(_a, []);
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.openexternallink);
    const { setWhitelistAll, addToWhitelist } = (0, exports.useOpenExternalLinkModalActions)();
    return (react_1.default.createElement(OpenlinkModal_1.default, Object.assign({ handleConfirm: () => __awaiter(void 0, void 0, void 0, function* () {
            yield electron_1.shell.openExternal(rest.url);
        }), url: rest.url, open: modal.open, handleClose: modal.handleClose, addToWhitelist: addToWhitelist, setWhitelistAll: setWhitelistAll }, rest)));
};
exports.default = OpenLinkModal;
