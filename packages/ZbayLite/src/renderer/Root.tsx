import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { SnackbarProvider } from 'notistack'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import store from './store'
import Index from './containers/windows/Index'
import Main from './containers/windows/Main'
import Loading from './containers/windows/Loading'
import Vault from './containers/windows/Vault'
import AddModerator from './containers/widgets/channelSettings/AddModerator'
import ChannelSettingsModal from './containers/widgets/channelSettings/ChannelSettingsModal'
import CreateChannelModal from './containers/widgets/channels/CreateChannelModal'
import CreateUsernameModal from './containers/widgets/createUsernameModal/CreateUsername'
import ErrorModal from './containers/ui/ErrorModal'
import JoinChannelModal from './containers/widgets/channels/JoinChannelModal'
import NewMessageModal from './containers/widgets/channels/NewMessageModal'
import Notifier from './containers/ui/Notifier'
import OpenExternalLinkModal from './containers/ui/OpenExternalLinkModal'
import SettingsModal from './containers/widgets/settings/SettingsModal'
import SecurityModal from './containers/widgets/settings/SecurityModal'
import UpdateModal from './containers/widgets/update/UpdateModal'
import QuitAppDialog from './containers/ui/QuitAppDialog'
import theme from './theme'

export default () => {
  const persistor = persistStore(store)
  return (
    <MuiThemeProvider theme={theme}>
      <HashRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SnackbarProvider maxSnack={3}>
              <AddModerator />
              <ChannelSettingsModal />
              <CreateChannelModal />
              <CreateUsernameModal />
              <CssBaseline />
              <ErrorModal />
              <JoinChannelModal />
              <NewMessageModal />
              <Notifier />
              <OpenExternalLinkModal />
              <SettingsModal />
              <SecurityModal />
              <UpdateModal />
              <QuitAppDialog />
              <Route path='/' component={Index} />
              <Route path='/main' component={Main} />
              <Route path='/loading' component={Loading} />
              <Route path='/vault' exact component={Vault} />
            </SnackbarProvider>
          </PersistGate>
        </Provider>
      </HashRouter>
    </MuiThemeProvider>
  )
}
