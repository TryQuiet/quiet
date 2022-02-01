"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModal = void 0;
const react_redux_1 = require("react-redux");
const modals_selectors_1 = require("../sagas/modals/modals.selectors");
const modals_slice_1 = require("../sagas/modals/modals.slice");
const useModal = (name) => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const open = (0, react_redux_1.useSelector)(modals_selectors_1.modalsSelectors.open(name));
    const props = (0, react_redux_1.useSelector)(modals_selectors_1.modalsSelectors.props(name));
    const handleOpen = (args) => dispatch(modals_slice_1.modalsActions.openModal({
        name: name,
        args: args
    }));
    const handleClose = () => dispatch(modals_slice_1.modalsActions.closeModal(name));
    return Object.assign({ open,
        handleOpen,
        handleClose }, props);
};
exports.useModal = useModal;
