"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessagePopover = void 0;
const react_1 = __importDefault(require("react"));
const Popover_1 = __importDefault(require("@material-ui/core/Popover"));
const react_jdenticon_1 = __importDefault(require("react-jdenticon"));
const QuickActionLayout_1 = __importDefault(require("../../ui/QuickActionLayout/QuickActionLayout"));
const SendMessagePopover = ({ username, address, anchorEl, handleClose, message, createNewContact, history, users, waggleUsers }) => {
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    const registeredUsername = Array.from(Object.values(users)).filter((obj) => obj.address === address)[0];
    let waggleIdentity = false;
    if (waggleUsers) {
        const arr = Array.from(Object.keys(waggleUsers));
        if (arr.includes(message === null || message === void 0 ? void 0 : message.publicKey) || arr.includes(registeredUsername === null || registeredUsername === void 0 ? void 0 : registeredUsername.publicKey)) {
            waggleIdentity = true;
        }
    }
    return (react_1.default.createElement(Popover_1.default, { id: id, open: open, anchorEl: anchorEl, onClose: handleClose, anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'center'
        }, transformOrigin: {
            vertical: 'top',
            horizontal: 'center'
        } },
        react_1.default.createElement(QuickActionLayout_1.default, { main: username, buttonName: "Send message", handleClose: handleClose, warning: !waggleIdentity ? 'Unregistered users cannot receive messages.' : null, onClick: () => {
                if ((message === null || message === void 0 ? void 0 : message.publicKey) || (registeredUsername === null || registeredUsername === void 0 ? void 0 : registeredUsername.publicKey)) {
                    createNewContact({
                        contact: {
                            address,
                            nickname: username,
                            publicKey: (message === null || message === void 0 ? void 0 : message.publicKey) || (registeredUsername === null || registeredUsername === void 0 ? void 0 : registeredUsername.publicKey)
                        },
                        history
                    });
                }
            } },
            react_1.default.createElement(react_jdenticon_1.default, { size: "100", value: username }))));
};
exports.SendMessagePopover = SendMessagePopover;
exports.default = exports.SendMessagePopover;
