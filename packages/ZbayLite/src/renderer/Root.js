import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'

import store from './store'
import Index from './containers/windows/Index'
import Main from './components/windows/Main'
import CreateVault from './containers/windows/CreateVault'
import UnlockVault from './containers/windows/UnlockVault'

import theme from './theme'

export default () => (
  <MuiThemeProvider theme={theme}>
    <HashRouter>
      <Provider store={store}>
        <CssBaseline />
        <Route path='/' exact component={Index} />
        <Route path='/main' exact component={Main} />
        <Route path='/vault/create' exact component={CreateVault} />
        <Route path='/vault/unlock' exact component={UnlockVault} />
      </Provider>
    </HashRouter>
  </MuiThemeProvider>
)
