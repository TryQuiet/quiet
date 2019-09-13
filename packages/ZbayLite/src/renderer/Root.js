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
import SendMoneyModal from './containers/ui/sendMoney/SendMoneyModal'

import theme from './theme'

export default () => (
  <MuiThemeProvider theme={theme}>
    <HashRouter>
      <Provider store={store}>
        <SnackbarProvider maxSnack={3}>
          <Notifier />
          <ErrorModal />
          <QuitAppDialog />
          <SendMoneyModal />
          <CssBaseline />
          <Route path='/' exact component={Index} />
          <Route path='/main' component={Main} />
          <Route path='/vault' component={Vault} />
          <Route path='/loading' component={Loading} />
        </SnackbarProvider>
      </Provider>
    </HashRouter>
  </MuiThemeProvider>
)
