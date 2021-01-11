import { applyMiddleware, createStore, compose } from 'redux'
import thunk from 'redux-thunk'
import promise from 'redux-promise-middleware'
import createDebounce from 'redux-debounced'
import createSagaMiddleware from 'redux-saga'
import rootSaga from '../sagas/index.saga'

import reducers from './reducers'
import { errorsMiddleware } from './middlewares'

const sagaMiddleware = createSagaMiddleware()

const composer = enhancers => {
  if (window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] && process.env.NODE_ENV === 'development') {
    return window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'](enhancers)
  }
  return compose(enhancers)
}

export default (initialState = {}) => {
  const store = createStore(
    reducers,
    initialState,
    composer(
      applyMiddleware(...[errorsMiddleware, createDebounce(), sagaMiddleware, thunk, promise()])
    )
  )
  sagaMiddleware.run(rootSaga)
  return store
}
