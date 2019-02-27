import 'typeface-roboto'
import React from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import { Provider } from 'react-redux'
import { HashRouter, Route } from 'react-router-dom'

import store from './store'
import Index from './containers/pages/Index'
import Home from './components/pages/Home'
import CreateVault from './containers/pages/CreateVault'
import UnlockVault from './containers/pages/UnlockVault'

export default () => (
  <HashRouter>
    <Provider store={store}>
      <CssBaseline />
      <Route path='/' exact component={Index} />
      <Route path='/home' exact component={Home} />
      <Route path='/vault/create' exact component={CreateVault} />
      <Route path='/vault/unlock' exact component={UnlockVault} />
    </Provider>
  </HashRouter>
)
