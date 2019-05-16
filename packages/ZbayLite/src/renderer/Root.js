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
import Notifier from './containers/ui/Notifier'

import theme from './theme'

export default () => (
  <MuiThemeProvider theme={theme}>
    <HashRouter>
      <Provider store={store}>
        <SnackbarProvider maxSnack={3}>
          <Notifier />
          <CssBaseline />
          <Route path='/' exact component={Index} />
          <Route path='/main' component={Main} />
          <Route path='/vault' component={Vault} />
        </SnackbarProvider>
      </Provider>
    </HashRouter>
  </MuiThemeProvider>
)
