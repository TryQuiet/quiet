"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelInput = exports.useDirectMessageInputActions = void 0;
const react_1 = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const nectar_1 = require("@zbayapp/nectar");
const ChannelInput_1 = __importDefault(require("../../../components/widgets/channels/ChannelInput"));
const useDirectMessageInputActions = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const onChange = (0, react_1.useCallback)((_value) => {
        // TODO https://github.com/ZbayApp/ZbayLite/issues/442
    }, [dispatch]);
    const onEnter = (0, react_1.useCallback)((message) => {
        console.log('send direct message', message);
    }, [dispatch]);
    const resetDebounce = (0, react_1.useCallback)(() => { }, [dispatch]);
    return { onChange, resetDebounce, onEnter };
};
exports.useDirectMessageInputActions = useDirectMessageInputActions;
const ChannelInput = () => {
    const [infoClass, setInfoClass] = react_1.default.useState(null);
    const { onChange, onEnter, resetDebounce } = (0, exports.useDirectMessageInputActions)();
    const channels = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.publicChannels);
    const currentChannelAddress = (0, react_redux_1.useSelector)(nectar_1.publicChannels.selectors.currentChannel);
    const currentChannel = channels.find(channel => channel.address === currentChannelAddress);
    const user = (0, react_redux_1.useSelector)(nectar_1.identity.selectors.currentIdentity);
    return (react_1.default.createElement(ChannelInput_1.default, { channelAddress: currentChannelAddress, channelName: currentChannel === null || currentChannel === void 0 ? void 0 : currentChannel.name, 
        // TODO https://github.com/ZbayApp/ZbayLite/issues/443
        inputPlaceholder: `#${currentChannel === null || currentChannel === void 0 ? void 0 : currentChannel.name} as @${user === null || user === void 0 ? void 0 : user.zbayNickname}`, onChange: value => {
            resetDebounce();
            onChange(value);
        }, onKeyPress: message => {
            onEnter(message);
        }, infoClass: infoClass, setInfoClass: setInfoClass }));
};
exports.ChannelInput = ChannelInput;
exports.default = exports.ChannelInput;
