import { applyMiddleware, createStore, compose } from 'redux'
import thunk from 'redux-thunk'
import promise from 'redux-promise-middleware'

import reducers from './reducers'
import { errorsMiddleware } from './middlewares'

const composer = (enhancers) => {
  if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
      process.env.NODE_ENV === 'development') {
    return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(enhancers)
  }
  return compose(enhancers)
}

export default ({
  initialState
} = {}) => createStore(
  reducers,
  initialState,
  composer(applyMiddleware(...[errorsMiddleware, thunk, promise()]))
)
