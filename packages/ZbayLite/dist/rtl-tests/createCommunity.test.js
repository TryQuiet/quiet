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
const test_utils_1 = require("react-dom/test-utils");
require("@testing-library/jest-dom/extend-expect");
const dom_1 = require("@testing-library/dom");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const typed_redux_saga_1 = require("typed-redux-saga");
const setupTests_1 = require("../shared/setupTests");
const socket_io_mock_1 = __importDefault(require("socket.io-mock"));
const renderComponent_1 = require("../renderer/testUtils/renderComponent");
const prepareStore_1 = require("../renderer/testUtils/prepareStore");
const store_keys_1 = require("../renderer/store/store.keys");
const socket_slice_1 = require("../renderer/sagas/socket/socket.slice");
const modals_slice_1 = require("../renderer/sagas/modals/modals.slice");
const createCommunity_1 = __importDefault(require("../renderer/containers/widgets/createCommunity/createCommunity"));
const CreateUsername_1 = __importDefault(require("../renderer/containers/widgets/createUsernameModal/CreateUsername"));
const modals_types_1 = require("../renderer/sagas/modals/modals.types");
const PerformCommunityAction_dictionary_1 = require("../renderer/components/widgets/performCommunityAction/PerformCommunityAction.dictionary");
const nectar_1 = require("@zbayapp/nectar");
const payload = (id) => ({
    id: id,
    hiddenService: {
        onionAddress: 'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
        privateKey: 'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ=='
    },
    peerId: {
        id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
        privKey: 'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
        pubKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE='
    }
});
describe('User', () => {
    let socket;
    let communityId;
    let payloadData;
    beforeEach(() => {
        socket = new socket_io_mock_1.default();
        setupTests_1.ioMock.mockImplementation(() => socket);
    });
    it('creates community and registers username', () => __awaiter(void 0, void 0, void 0, function* () {
        const { store, runSaga } = yield (0, prepareStore_1.prepareStore)({
            [store_keys_1.StoreKeys.Socket]: Object.assign(Object.assign({}, new socket_slice_1.SocketState()), { isConnected: false }),
            [store_keys_1.StoreKeys.Modals]: Object.assign(Object.assign({}, new modals_slice_1.ModalsInitialState()), { [modals_types_1.ModalName.createCommunityModal]: { open: true } })
        }, socket // Fork Nectar's sagas
        );
        (0, renderComponent_1.renderComponent)(react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(createCommunity_1.default, null),
            react_1.default.createElement(CreateUsername_1.default, null)), store);
        jest.spyOn(socket, 'emit').mockImplementation((action, ...input) => {
            if (action === nectar_1.SocketActionTypes.CREATE_NETWORK) {
                const data = input;
                const id = data[0];
                payloadData = payload(id);
                return socket.socketClient.emit(nectar_1.SocketActionTypes.NEW_COMMUNITY, {
                    id: id,
                    payload: payload(id)
                });
            }
            if (action === nectar_1.SocketActionTypes.REGISTER_OWNER_CERTIFICATE) {
                const data = input;
                communityId = data[0];
                const CA = data[2];
                return socket.socketClient.emit(nectar_1.SocketActionTypes.SEND_USER_CERTIFICATE, {
                    id: communityId,
                    payload: {
                        peers: [''],
                        certificate: CA.certificate,
                        rootCa: 'rootCa'
                    }
                });
            }
        });
        // Confirm proper modal title is displayed
        const dictionary = (0, PerformCommunityAction_dictionary_1.CreateCommunityDictionary)();
        const createCommunityTitle = dom_1.screen.getByText(dictionary.header);
        expect(createCommunityTitle).toBeVisible();
        // Enter community name and hit button
        const createCommunityInput = dom_1.screen.getByPlaceholderText(dictionary.placeholder);
        const createCommunityButton = dom_1.screen.getByText(dictionary.button);
        user_event_1.default.type(createCommunityInput, 'rockets');
        user_event_1.default.click(createCommunityButton);
        // Confirm user is being redirected to username registration
        const createUsernameTitle = yield dom_1.screen.findByText('Register a username');
        expect(createUsernameTitle).toBeVisible();
        // Enter username and hit button
        const createUsernameInput = yield dom_1.screen.findByPlaceholderText('Enter a username');
        const createUsernameButton = yield dom_1.screen.findByText('Register');
        user_event_1.default.type(createUsernameInput, 'holmes');
        user_event_1.default.click(createUsernameButton);
        yield (0, test_utils_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield runSaga(testCreateCommunitySaga).toPromise();
            yield runSaga(mockAddressResponse).toPromise();
        }));
        expect(createUsernameTitle).not.toBeVisible();
        expect(createCommunityTitle).not.toBeVisible();
    }));
    function* testCreateCommunitySaga() {
        yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.createNewCommunity);
        yield* (0, typed_redux_saga_1.take)(nectar_1.communities.actions.responseCreateCommunity);
        yield* (0, typed_redux_saga_1.take)(nectar_1.identity.actions.registerUsername);
        yield* (0, typed_redux_saga_1.take)(nectar_1.identity.actions.storeUserCertificate);
    }
    function* mockAddressResponse() {
        yield* (0, typed_redux_saga_1.apply)(socket.socketClient, socket.socketClient.emit, [nectar_1.SocketActionTypes.REGISTRAR,
            {
                id: communityId,
                peerId: payloadData.peerId.id,
                payload: {
                    privateKey: payloadData.hiddenService.privateKey,
                    onionAddress: payloadData.hiddenService.onionAddress,
                    port: 7909
                }
            }
        ]);
    }
});
