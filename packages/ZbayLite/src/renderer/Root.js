import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { SnackbarProvider } from 'notistack'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'

import store from './store'
import Index from './containers/windows/Index'
import Main from './containers/windows/Main'
import Vault from './containers/windows/Vault'
import Loading from './containers//windows/Loading'
import Notifier from './containers/ui/Notifier'
import ErrorModal from './containers/ui/ErrorModal'
import QuitAppDialog from './containers/ui/QuitAppDialog'
import TopUpModal from './containers/ui/TopUpModal'
import SendMoneyModal from './containers/ui/sendMoney/SendMoneyModal'
import UpdateModal from './containers/widgets/update/UpdateModal'
import CreateChannelModal from './containers/widgets/channels/CreateChannelModal'
import NewMessageModal from './containers/widgets/channels/NewMessageModal'
import JoinChannelModal from './containers/widgets/channels/JoinChannelModal'
import AdvertModal from './containers/ui/adverts/AdvertModal'
import AdvertActionsModal from './containers/ui/adverts/AdvertActionsModal'
import PublishChannelModal from './containers/ui/PublishChannelModal'
import SentFundsModal from './containers/ui/SentFundsModal'
import SendFundsModal from './containers/ui/adverts/SendFundsModal'

import theme from './theme'

export default () => (
  <MuiThemeProvider theme={theme}>
    <HashRouter>
      <Provider store={store}>
        <SnackbarProvider maxSnack={3}>
          <Notifier />
          <ErrorModal />
          <QuitAppDialog />
          <UpdateModal />
          <SendMoneyModal />
          <TopUpModal />
          <CssBaseline />
          <CreateChannelModal />
          <NewMessageModal />
          <JoinChannelModal />
          <AdvertModal />
          <AdvertActionsModal />
          <SendFundsModal />
          <PublishChannelModal />
          <SentFundsModal />
          <Route path='/vault' exact component={Vault} />
          <Route path='/main' component={Main} />
          <Route path='/zcashNode' component={Index} />
          <Route path='/loading' component={Loading} />
        </SnackbarProvider>
      </Provider>
    </HashRouter>
  </MuiThemeProvider>
)
