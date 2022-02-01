"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("typeface-roboto");
const react_1 = __importDefault(require("react"));
const CssBaseline_1 = __importDefault(require("@material-ui/core/CssBaseline"));
const notistack_1 = require("notistack");
const styles_1 = require("@material-ui/core/styles");
const react_redux_1 = require("react-redux");
const react_router_dom_1 = require("react-router-dom");
const react_2 = require("redux-persist/integration/react");
const redux_persist_1 = require("redux-persist");
const store_1 = __importDefault(require("./store"));
const Index_1 = __importDefault(require("./containers/windows/Index"));
const Main_1 = __importDefault(require("./containers/windows/Main"));
const ChannelSettingsModal_1 = __importDefault(require("./containers/widgets/channelSettings/ChannelSettingsModal"));
const CreateUsername_1 = __importDefault(require("./containers/widgets/createUsernameModal/CreateUsername"));
const ErrorModal_1 = __importDefault(require("./containers/ui/ErrorModal"));
const JoinChannelModal_1 = __importDefault(require("./containers/widgets/channels/JoinChannelModal"));
const NewMessageModal_1 = __importDefault(require("./containers/widgets/channels/NewMessageModal"));
const OpenExternalLinkModal_1 = __importDefault(require("./containers/ui/OpenExternalLinkModal"));
const sentryWarning_1 = __importDefault(require("./containers/widgets/sentryWarning/sentryWarning"));
const SettingsModal_1 = __importDefault(require("./containers/widgets/settings/SettingsModal"));
const UpdateModal_1 = __importDefault(require("./containers/widgets/update/UpdateModal"));
const QuitAppDialog_1 = __importDefault(require("./containers/ui/QuitAppDialog"));
const theme_1 = __importDefault(require("./theme"));
const createCommunity_1 = __importDefault(require("./containers/widgets/createCommunity/createCommunity"));
const joinCommunity_1 = __importDefault(require("./containers/widgets/joinCommunity/joinCommunity"));
const loadingPanel_1 = __importDefault(require("./containers/widgets/loadingPanel/loadingPanel"));
const CreateChannel_1 = __importDefault(require("./containers/widgets/channels/CreateChannel"));
exports.default = () => {
    const persistor = (0, redux_persist_1.persistStore)(store_1.default);
    return (react_1.default.createElement(styles_1.MuiThemeProvider, { theme: theme_1.default },
        react_1.default.createElement(react_router_dom_1.HashRouter, null,
            react_1.default.createElement(react_redux_1.Provider, { store: store_1.default },
                react_1.default.createElement(react_2.PersistGate, { loading: null, persistor: persistor },
                    react_1.default.createElement(notistack_1.SnackbarProvider, { maxSnack: 3 },
                        react_1.default.createElement(ChannelSettingsModal_1.default, null),
                        react_1.default.createElement(CreateChannel_1.default, null),
                        react_1.default.createElement(joinCommunity_1.default, null),
                        react_1.default.createElement(createCommunity_1.default, null),
                        react_1.default.createElement(CreateUsername_1.default, null),
                        react_1.default.createElement(loadingPanel_1.default, null),
                        react_1.default.createElement(CssBaseline_1.default, null),
                        react_1.default.createElement(ErrorModal_1.default, null),
                        react_1.default.createElement(JoinChannelModal_1.default, null),
                        react_1.default.createElement(NewMessageModal_1.default, null),
                        react_1.default.createElement(OpenExternalLinkModal_1.default, null),
                        react_1.default.createElement(sentryWarning_1.default, null),
                        react_1.default.createElement(SettingsModal_1.default, null),
                        react_1.default.createElement(UpdateModal_1.default, null),
                        react_1.default.createElement(QuitAppDialog_1.default, null),
                        react_1.default.createElement(react_router_dom_1.Route, { path: '/', component: Index_1.default }),
                        react_1.default.createElement(react_router_dom_1.Route, { path: '/main', component: Main_1.default })))))));
};
