"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelInfo = exports.useChannelInfoData = void 0;
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const ChannelInfo_1 = __importDefault(require("../../../components/widgets/channelSettings/ChannelInfo"));
const channel_1 = __importDefault(require("../../../store/selectors/channel"));
const useChannelInfoData = () => {
    const data = {
        initialValues: {
            updateChannelDescription: (0, react_redux_1.useSelector)(channel_1.default.channelDesription)
        }
    };
    return data;
};
exports.useChannelInfoData = useChannelInfoData;
const ChannelInfo = () => {
    const { initialValues } = (0, exports.useChannelInfoData)();
    return (react_1.default.createElement(ChannelInfo_1.default, { initialValues: initialValues }));
};
exports.ChannelInfo = ChannelInfo;
exports.default = exports.ChannelInfo;
