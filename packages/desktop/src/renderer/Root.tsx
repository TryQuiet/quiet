import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import { Provider } from 'react-redux'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import store from './store'
import Index from './containers/windows/Index'
import Main from './containers/windows/Main'
import CreateUsername from './components/CreateUsername/CreateUsername'
import SentryWarning from './containers/widgets/sentryWarning/sentryWarning'
import SettingsModal from './components/Settings/Settings'
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
import { LeaveCommunity } from './components/Settings/Tabs/LeaveCommunity/LeaveCommunity'
import SearchModal from './components/SearchModal/SearchModal'

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
                <SearchModal />
                <ErrorModal />
                <LoadingPanel />
                <CreateChannel />
                <JoinCommunity />
                <CreateCommunity />
                <LeaveCommunity />
                <CreateUsername />
                <CssBaseline />
                <SettingsModal />
                <UpdateModal />
                <QuitAppDialog />
                <Routes>
                  <Route index path='/' element={<Index />} />
                  <Route path='/main/*' element={<Main />} />
                </Routes>
              </PersistGate>
            </Provider>
          </HashRouter>
        </DndProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
