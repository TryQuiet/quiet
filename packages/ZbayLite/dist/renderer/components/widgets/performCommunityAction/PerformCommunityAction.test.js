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
require("@testing-library/jest-dom");
const react_1 = require("@testing-library/react");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const react_2 = __importDefault(require("react"));
const community_keys_1 = require("../../../components/widgets/performCommunityAction/community.keys");
const PerformCommunityActionComponent_1 = __importDefault(require("../../../components/widgets/performCommunityAction/PerformCommunityActionComponent"));
const fieldsErrors_1 = require("../../../forms/fieldsErrors");
const renderComponent_1 = require("../../../testUtils/renderComponent");
describe('PerformCommunityAction component (create community mode)', () => {
    const action = community_keys_1.CommunityAction.Create;
    it('creates community on submit if connection is ready', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const communityName = 'communityname';
        const textInput = result.queryByPlaceholderText('Community name');
        expect(textInput).not.toBeNull();
        user_event_1.default.type(textInput, communityName);
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeEnabled();
        user_event_1.default.click(submitButton);
        yield (0, react_1.waitFor)(() => expect(handleCommunityAction).toBeCalledWith(communityName));
    }));
    it.each([
        ['bu', fieldsErrors_1.CommunityNameErrors.NameToShort],
        ['Community Name', fieldsErrors_1.CommunityNameErrors.WrongCharacter],
        ['mybeautifulcommunityname', fieldsErrors_1.CommunityNameErrors.NameTooLong]
    ])('user inserting invalid community name "%s" should see "%s" error', (communityName, error) => __awaiter(void 0, void 0, void 0, function* () {
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const textInput = result.queryByPlaceholderText('Community name');
        expect(textInput).not.toBeNull();
        user_event_1.default.type(textInput, communityName);
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeEnabled();
        user_event_1.default.click(submitButton);
        yield (0, react_1.waitFor)(() => expect(handleCommunityAction).not.toBeCalled());
        const errorElement = react_1.screen.queryByText(error);
        expect(errorElement).not.toBeNull();
    }));
    it('blocks submit button if connection is not ready', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: false, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeDisabled();
    }));
    it('handles redirection if user clicks on the link', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleRedirection = jest.fn();
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: handleRedirection, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const switchLink = result.queryByText('join a community');
        expect(switchLink).not.toBeNull();
        user_event_1.default.click(switchLink);
        expect(handleRedirection).toBeCalled();
        expect(handleCommunityAction).not.toBeCalled();
    }));
});
describe('PerformCommunityAction component (join community mode)', () => {
    const action = community_keys_1.CommunityAction.Join;
    it('joins community on submit if connection is ready and registrar url is correct', () => __awaiter(void 0, void 0, void 0, function* () {
        const registrarUrl = 'nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad';
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const textInput = result.queryByPlaceholderText('Invite link');
        expect(textInput).not.toBeNull();
        user_event_1.default.type(textInput, registrarUrl);
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeEnabled();
        user_event_1.default.click(submitButton);
        yield (0, react_1.waitFor)(() => expect(handleCommunityAction).toBeCalledWith(registrarUrl));
    }));
    it.each([
        ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad088888', fieldsErrors_1.InviteLinkErrors.WrongCharacter],
        ['nqnw4kc4c77fb47lk52m5l57h4tc', fieldsErrors_1.InviteLinkErrors.WrongCharacter],
        ['nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olaż', fieldsErrors_1.InviteLinkErrors.WrongCharacter],
        ['http://nqnw4kc4c77fb47lk52m5l57h4tcxceo7ymxekfn7yh5m66t4jv2olad.onion', fieldsErrors_1.InviteLinkErrors.WrongCharacter]
    ])('user inserting invalid url %s should see "%s" error', (registrarUrl, error) => __awaiter(void 0, void 0, void 0, function* () {
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const textInput = result.queryByPlaceholderText('Invite link');
        expect(textInput).not.toBeNull();
        user_event_1.default.type(textInput, registrarUrl);
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeEnabled();
        user_event_1.default.click(submitButton);
        yield (0, react_1.waitFor)(() => expect(handleCommunityAction).not.toBeCalled());
        const errorElement = react_1.screen.queryByText(error);
        expect(errorElement).not.toBeNull();
    }));
    it('blocks submit button if connection is not ready', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleCommunityAction = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: handleCommunityAction, handleRedirection: () => { }, isConnectionReady: false, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const textInput = result.queryByPlaceholderText('Invite link');
        expect(textInput).not.toBeNull();
        user_event_1.default.type(textInput, 'My Community');
        const submitButton = result.queryByRole('button');
        expect(submitButton).not.toBeNull();
        expect(submitButton).toBeDisabled();
        expect(handleCommunityAction).not.toBeCalled();
    }));
    it('handles redirection if user clicks on the link', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleRedirection = jest.fn();
        const component = react_2.default.createElement(PerformCommunityActionComponent_1.default, { open: true, handleClose: () => { }, communityAction: action, handleCommunityAction: () => { }, handleRedirection: handleRedirection, isConnectionReady: true, community: false });
        const result = (0, renderComponent_1.renderComponent)(component);
        const switchLink = result.queryByText('create a new community');
        expect(switchLink).not.toBeNull();
        user_event_1.default.click(switchLink);
        expect(handleRedirection).toBeCalled();
    }));
});
