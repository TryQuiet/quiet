import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import store from './store'
import Index from './containers/windows/Index'
import Main from './containers/windows/Main'
import CreateUsernameModal from './containers/widgets/createUsernameModal/CreateUsername'
import JoinChannelModal from './containers/widgets/channels/JoinChannelModal'
import SentryWarning from './containers/widgets/sentryWarning/sentryWarning'
import SettingsModal from './containers/widgets/settings/SettingsModal'
import UpdateModal from './containers/widgets/update/UpdateModal'
import QuitAppDialog from './containers/ui/QuitAppDialog'
import theme from './theme'
import CreateCommunity from './containers/widgets/createCommunity/createCommunity'
import JoinCommunity from './containers/widgets/joinCommunity/joinCommunity'
import LoadingPanel from './containers/widgets/loadingPanel/loadingPanel'
import CreateChannel from './containers/widgets/channels/CreateChannel'

export default () => {
  const persistor = persistStore(store)
  return (
    <MuiThemeProvider theme={theme}>
      <HashRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
              <CreateChannel />
              <JoinCommunity />
              <CreateCommunity />
              <CreateUsernameModal />
              <LoadingPanel />
              <CssBaseline />
              <JoinChannelModal />
              <SentryWarning />
              <SettingsModal />
              <UpdateModal />
              <QuitAppDialog />
              <Route path='/' component={Index} />
              <Route path='/main' component={Main} />
          </PersistGate>
        </Provider>
      </HashRouter>
    </MuiThemeProvider>
  )
}
