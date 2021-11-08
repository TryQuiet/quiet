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
import ChannelSettingsModal from './containers/widgets/channelSettings/ChannelSettingsModal'
import CreateChannelModal from './containers/widgets/channels/CreateChannelModal'
import CreateUsernameModal from './containers/widgets/createUsernameModal/CreateUsername'
import ErrorModal from './containers/ui/ErrorModal'
import JoinChannelModal from './containers/widgets/channels/JoinChannelModal'
import NewMessageModal from './containers/widgets/channels/NewMessageModal'
import OpenExternalLinkModal from './containers/ui/OpenExternalLinkModal'
import SettingsModal from './containers/widgets/settings/SettingsModal'
import UpdateModal from './containers/widgets/update/UpdateModal'
import QuitAppDialog from './containers/ui/QuitAppDialog'
import theme from './theme'
import CreateCommunity from './containers/widgets/createCommunity/createCommunity'
import JoinCommunity from './containers/widgets/joinCommunity/joinCommunity'
import LoadingPanel from './containers/widgets/loadingPanel/loadingPanel'

export default () => {
  const persistor = persistStore(store)
  return (
    <MuiThemeProvider theme={theme}>
      <HashRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SnackbarProvider maxSnack={3}>
              <ChannelSettingsModal />
              <CreateChannelModal />
              <JoinCommunity />
              <CreateCommunity />
              <CreateUsernameModal />
              <LoadingPanel />
              <CssBaseline />
              <ErrorModal />
              <JoinChannelModal />
              <NewMessageModal />
              <OpenExternalLinkModal />
              <SettingsModal />
              <UpdateModal />
              <QuitAppDialog />
              <Route path='/' component={Index} />
              <Route path='/main' component={Main} />
            </SnackbarProvider>
          </PersistGate>
        </Provider>
      </HashRouter>
    </MuiThemeProvider>
  )
}
