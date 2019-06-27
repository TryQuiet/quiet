import criticalErrorHandlers from './handlers/criticalError'
import modalsHandlers from './handlers/modals'

const isPromise = value => value !== null &&
      typeof value === 'object' &&
      typeof value.then === 'function'

const _dispatchError = (store, err) => {
  const criticalError = {
    message: err.message,
    traceback: err.stack
  }
  store.dispatch(
    criticalErrorHandlers.actions.setCriticalError(criticalError)
  )
  store.dispatch(
    modalsHandlers.actionCreators.openModal('criticalError')()
  )
}

export const errorsMiddleware = store => next => action => {
  // Handle action with Promise payload
  if (isPromise(action.payload)) {
    return next(action).catch(error => {
      _dispatchError(store, error)
      throw error
    })
  } else {
    let result
    // Handle throws from regular actions
    try {
      result = next(action)

      // If next didn't throw check if the action is an async thunk and add error handling
      if (isPromise(result)) {
        result.catch(error => {
          _dispatchError(store, error)
          throw error
        })
      }
    } catch (err) {
      _dispatchError(store, err)
      throw err
    }

    // If no errors simply return result of action
    return result
  }
}
