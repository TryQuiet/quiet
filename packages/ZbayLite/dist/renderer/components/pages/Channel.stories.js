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
exports.Component = void 0;
const react_1 = __importStar(require("react"));
const decorators_1 = require("../../storybook/decorators");
const Channel_1 = __importDefault(require("./Channel"));
const Template = args => {
    const [messages, _setMessages] = (0, react_1.useState)({
        count: 16,
        groups: {
            '28 Oct': [
                [
                    {
                        id: '1',
                        type: 1,
                        message: 'Hello',
                        createdAt: 0,
                        date: '28 Oct, 10:00',
                        nickname: 'alice'
                    },
                    {
                        id: '2',
                        type: 1,
                        message: "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
                        createdAt: 0,
                        date: '28 Oct, 10:01',
                        nickname: 'alice'
                    }
                ],
                [
                    {
                        id: '3',
                        type: 1,
                        message: 'Great, thanks!',
                        createdAt: 0,
                        date: '28 Oct, 10:02',
                        nickname: 'john'
                    }
                ]
            ],
            Today: [
                [
                    {
                        id: '4',
                        type: 1,
                        message: 'Luck, I am your father!',
                        createdAt: 0,
                        date: '12:40',
                        nickname: 'chad'
                    },
                    {
                        id: '5',
                        type: 1,
                        message: 'That\'s impossible!',
                        createdAt: 0,
                        date: '12:41',
                        nickname: 'chad'
                    },
                    {
                        id: '6',
                        type: 1,
                        message: 'Nooo!',
                        createdAt: 0,
                        date: '12:45',
                        nickname: 'chad'
                    }
                ],
                [
                    {
                        id: '7',
                        type: 1,
                        message: 'Uhuhu!',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'anakin'
                    }
                ],
                [
                    {
                        id: '8',
                        type: 1,
                        message: 'Why?',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'anakin'
                    }
                ],
                [
                    {
                        id: '9',
                        type: 1,
                        message: 'Messages more there should be',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'yoda'
                    }
                ],
                [
                    {
                        id: '11',
                        type: 1,
                        message: 'I Agree',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'obi'
                    },
                    {
                        id: '12',
                        type: 1,
                        message: 'Of course, I Agree',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'obi'
                    }
                ],
                [
                    {
                        id: '13',
                        type: 1,
                        message: 'Wrough!',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'wookie'
                    }
                ],
                [
                    {
                        id: '14',
                        type: 1,
                        message: 'Yeah!',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'leah'
                    }
                ],
                [
                    {
                        id: '15',
                        type: 1,
                        message: 'The more messages the better',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'luke'
                    }
                ],
                [
                    {
                        id: '16',
                        type: 1,
                        message: 'We cannot grant you the rank of messager',
                        createdAt: 0,
                        date: '12:46',
                        nickname: 'windoo'
                    }
                ]
            ]
        }
    });
    const sendMessage = (0, react_1.useCallback)((_message) => { }, []);
    args.messages = messages;
    args.onInputEnter = sendMessage;
    return react_1.default.createElement(Channel_1.default, Object.assign({}, args));
};
exports.Component = Template.bind({});
const args = {
    user: {
        id: 'id',
        zbayNickname: 'chad',
        hiddenService: {
            onionAddress: 'onionAddress',
            privateKey: 'privateKey'
        },
        peerId: {
            id: 'id',
            privKey: 'privKey',
            pubKey: 'pubKey'
        },
        dmKeys: {
            publicKey: 'publicKey',
            privateKey: 'privateKey'
        },
        userCsr: {
            userCsr: 'userCsr',
            userKey: 'userKey',
            pkcs10: {
                publicKey: 'publicKey',
                privateKey: 'privateKey',
                pkcs10: 'pkcs10'
            }
        },
        userCertificate: 'userCertificate'
    },
    channel: {
        name: 'general',
        description: 'This is awesome channel in which you can chat with your friends',
        owner: 'alice',
        timestamp: 1636971603355,
        address: 'channelAddress'
    },
    channelSettingsModal: {
        open: false,
        handleOpen: function (_args) { },
        handleClose: function () { }
    },
    channelInfoModal: {
        open: false,
        handleOpen: function (_args) { },
        handleClose: function () { }
    },
    messages: {
        count: 0,
        groups: {}
    },
    setChannelLoadingSlice: function (_value) { },
    onDelete: function () { },
    onInputChange: function (_value) { },
    onInputEnter: function (_message) { },
    mutedFlag: false,
    notificationFilter: '',
    openNotificationsTab: function () { }
};
exports.Component.args = args;
const component = {
    title: 'Components/ChannelComponent',
    decorators: [decorators_1.withTheme],
    component: Channel_1.default
};
exports.default = component;
