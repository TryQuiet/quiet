import { sagaConst } from '../saga.const'

export const template = `
import { TestApi, testSaga } from 'redux-saga-test-plan'

import { {{ ${sagaConst.vars.name} }}Saga } from './{{ ${sagaConst.vars.name} }}.saga'

describe('{{ ${sagaConst.vars.name} }}Saga', () => {
  const saga: TestApi = testSaga({{ ${sagaConst.vars.name} }}Saga)

  beforeEach(() => {
    saga.restart()
  })

  test('should be defined', () => {
    saga.next().isDone()
  })
})
`
