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
/* eslint import/first: 0 */
const channel_1 = __importStar(require("./channel"));
const create_1 = __importDefault(require("../create"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const contacts_1 = require("../handlers/contacts");
describe('Channel selectors', () => {
    let store = null;
    beforeEach(() => {
        jest.clearAllMocks();
        store = (0, create_1.default)({
            channel: {
                spentFilterValue: new bignumber_js_1.default(0),
                message: {},
                shareableUri: '',
                address: '',
                loader: { loading: false, message: '' },
                members: {},
                showInfoMsg: true,
                isSizeCheckingInProgress: false,
                displayableMessageLimit: 50,
                id: 123
            },
            contacts: {
                123: new contacts_1.Contact()
            }
        });
    });
    it('- data', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(channel_1.default.data(store.getState())).toMatchInlineSnapshot(`
      Contact {
        "address": "",
        "key": "",
        "messages": Array [],
        "newMessages": Array [],
        "typingIndicator": false,
        "username": "",
        "vaultMessages": Array [],
        Symbol(immer-draftable): true,
      }
    `);
    }));
    const initialState = {
        identity: {
            data: {
                id: '',
                address: '',
                transparentAddress: '',
                signerPrivKey: '',
                signerPubKey: '',
                name: '',
                shippingData: {
                    firstName: '',
                    lastName: '',
                    street: '',
                    country: '',
                    region: '',
                    city: '',
                    postalCode: ''
                },
                balance: new bignumber_js_1.default('0'),
                lockedBalance: new bignumber_js_1.default('0'),
                donationAllow: true,
                shieldingTax: true,
                donationAddress: '',
                onionAddress: '',
                freeUtxos: 0,
                addresses: [''],
                shieldedAddresses: ['']
            }
        },
        users: {
            kolega: {
                key: '',
                firstName: '',
                publicKey: '',
                lastName: '',
                nickname: '',
                address: '',
                onionAddress: '',
                createdAt: 0
            }
        },
        channel: {
            spentFilterValue: {},
            id: 'anonfriend',
            message: {},
            shareableUri: '',
            address: '',
            loader: {},
            members: {},
            showInfoMsg: true,
            isSizeCheckingInProgress: true,
            messageSizeStatus: true,
            displayableMessageLimit: 0
        },
        contacts: {
            kumpel: {
                lastSeen: {},
                key: '',
                username: '',
                address: '',
                newMessages: [],
                vaultMessages: [],
                messages: [],
                offerId: '',
                unread: 0,
                connected: false
            }
        },
        waggle: {
            isWaggleConnected: false
        },
        directMessages: {
            users: {},
            conversations: {},
            conversationsList: {},
            privateKey: '',
            publicKey: ''
        }
    };
    it('- input_when_waggle_disconnected', () => __awaiter(void 0, void 0, void 0, function* () {
        const store = (0, create_1.default)(Object.assign({}, initialState));
        expect(channel_1.default.inputLocked(store.getState())).toEqual(channel_1.INPUT_STATE.NOT_CONNECTED);
    }));
    it('- input_when_waggle_connected_but_channel_is_not_DM_or_public_channel', () => __awaiter(void 0, void 0, void 0, function* () {
        const store = (0, create_1.default)(Object.assign(Object.assign({}, initialState), { waggle: {
                isWaggleConnected: true
            }, directMessages: Object.assign(Object.assign({}, initialState.directMessages), { users: {
                    anonfriend: {
                        publicKey: 'friend',
                        nickname: 'anonfriend'
                    }
                } }) }));
        expect(channel_1.default.inputLocked(store.getState())).toEqual(channel_1.INPUT_STATE.USER_NOT_REGISTERED);
    }));
    it('- input_when_waggle_is_connected_and_is_dm_channel', () => __awaiter(void 0, void 0, void 0, function* () {
        const store = (0, create_1.default)(Object.assign(Object.assign({}, initialState), { waggle: {
                isWaggleConnected: true
            }, directMessages: {
                users: {
                    friend: {
                        publicKey: 'friend'
                    }
                }
            }, users: {
                somebody: {
                    key: '',
                    firstName: '',
                    publicKey: 'friend',
                    lastName: '',
                    nickname: '',
                    address: '',
                    onionAddress: '',
                    createdAt: 0
                }
            }, channel: {
                id: 'friend'
            } }));
        expect(channel_1.default.inputLocked(store.getState())).toEqual(channel_1.INPUT_STATE.AVAILABLE);
    }));
});
