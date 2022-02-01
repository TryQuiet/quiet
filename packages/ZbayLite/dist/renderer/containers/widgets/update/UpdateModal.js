"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDispatchToProps = void 0;
const react_1 = __importDefault(require("react"));
const redux_1 = require("redux");
const react_redux_1 = require("react-redux");
const UpdateModal_1 = __importDefault(require("../../../components/widgets/update/UpdateModal"));
const update_1 = __importDefault(require("../../../store/handlers/update"));
const hooks_1 = require("../../hooks");
const modals_types_1 = require("../../../sagas/modals/modals.types");
const mapDispatchToProps = dispatch => (0, redux_1.bindActionCreators)({
    handleUpdate: update_1.default.epics.startApplicationUpdate,
    rejectUpdate: update_1.default.epics.declineUpdate
}, dispatch);
exports.mapDispatchToProps = mapDispatchToProps;
const ApplicationUpdateModal = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const actions = (0, exports.mapDispatchToProps)(dispatch);
    const modal = (0, hooks_1.useModal)(modals_types_1.ModalName.applicationUpdate);
    return react_1.default.createElement(UpdateModal_1.default, Object.assign({}, modal, actions));
};
exports.default = ApplicationUpdateModal;
