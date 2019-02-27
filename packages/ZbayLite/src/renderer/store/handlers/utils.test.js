import { typePending, typeFulfilled, typeRejected } from './utils'

describe('utils', () => {
  describe('action types', () => {
    it('creates pending action type', () => {
      expect(typePending('TEST_ACTION')).toEqual('TEST_ACTION_PENDING')
    })

    it('creates fulfilled action type', () => {
      expect(typeFulfilled('TEST_ACTION')).toEqual('TEST_ACTION_FULFILLED')
    })

    it('creates rejected action type', () => {
      expect(typeRejected('TEST_ACTION')).toEqual('TEST_ACTION_REJECTED')
    })
  })
})
