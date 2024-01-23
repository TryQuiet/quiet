import { testSaga } from 'redux-saga-test-plan'
import { ErrorCodes, ErrorMessages, ErrorTypes } from '@quiet/types'
import { errorsActions } from '../errors.slice'
import { handleErrorsSaga } from './handleErrors.saga'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'

describe('handle errors', () => {
  test('Error adds error to store', async () => {
    const errorPayload = {
      type: ErrorTypes.OTHER,
      message: ErrorMessages.NETWORK_SETUP_FAILED,
      code: ErrorCodes.BAD_REQUEST,
    }
    const addErrorAction = errorsActions.handleError(errorPayload)
    testSaga(handleErrorsSaga, addErrorAction).next().put(errorsActions.addError(errorPayload)).next().isDone()
  })
})
