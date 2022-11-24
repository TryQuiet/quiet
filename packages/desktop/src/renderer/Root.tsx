import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import store from './store'
import Index from './containers/windows/Index'
import Main from './containers/windows/Main'
import CreateUsername from './components/CreateUsername/CreateUsername'
import JoinChannelModal from './containers/widgets/channels/JoinChannelModal'
import SentryWarning from './containers/widgets/sentryWarning/sentryWarning'
import SettingsModal from './containers/widgets/settings/SettingsModal'
import UpdateModal from './containers/widgets/update/UpdateModal'
import QuitAppDialog from './containers/ui/QuitAppDialog'
import theme from './theme'
import CreateCommunity from './components/CreateJoinCommunity/CreateCommunity/CreateCommunity'
import JoinCommunity from './components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateChannel from './components/Channel/CreateChannel/CreateChannel'
import LoadingPanel from './components/LoadingPanel/LoadingPanel'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import { ErrorModal } from './components/ui/ErrorModal/ErrorModal'


// declare module '@mui/styles/defaultTheme' {
//   // eslint-disable-next-line @typescript-eslint/no-empty-interface
//   interface DefaultTheme extends Theme {}
// }


export const persistor = persistStore(store)
export default () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <DndProvider backend={HTML5Backend}>
          <HashRouter>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <SentryWarning />
                <ErrorModal />
                <LoadingPanel />
                <CreateChannel />
                <JoinCommunity />
                <CreateCommunity />
                <CreateUsername />
                <CssBaseline />
                <JoinChannelModal />
                <SettingsModal />
                <UpdateModal />
                <QuitAppDialog />
                <Route path='/' component={Index} />
                <Route path='/main' component={Main} />
              </PersistGate>
            </Provider>
          </HashRouter>
        </DndProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
