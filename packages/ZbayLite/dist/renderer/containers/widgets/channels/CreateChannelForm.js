"use strict";
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
exports.CreateChannelForm = exports.mapDispatchToProps = void 0;
const react_1 = __importDefault(require("react"));
const redux_1 = require("redux");
const react_redux_1 = require("react-redux");
const CreateChannelForm_1 = __importDefault(require("../../../components/widgets/channels/CreateChannelForm"));
const CreateChannelFormFinish_1 = __importDefault(require("../../../components/widgets/channels/CreateChannelFormFinish"));
// import channelsHandlers from '../../../store/handlers/channels'
const mapDispatchToProps = dispatch => (0, redux_1.bindActionCreators)({
// onSubmit: channelsHandlers.epics.createChannel
}, dispatch);
exports.mapDispatchToProps = mapDispatchToProps;
const stepToComponent = {
    0: CreateChannelForm_1.default,
    1: CreateChannelFormFinish_1.default
};
const CreateChannelForm = (_a) => {
    var props = __rest(_a, []);
    const [step, setStep] = react_1.default.useState(0);
    const Component = stepToComponent[step];
    return react_1.default.createElement(Component, Object.assign({}, props, { setStep: setStep }));
};
exports.CreateChannelForm = CreateChannelForm;
exports.default = (0, react_redux_1.connect)(null, exports.mapDispatchToProps)(exports.CreateChannelForm);
