import { createSelector } from 'reselect'
import { createLogger } from '../../utils/logger'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'

const logger = createLogger('captchaSelectors')

const captchaSlice: CreatedSelectors[StoreKeys.Captcha] = (state: StoreState) => state[StoreKeys.Captcha]

export const captchaRequested = createSelector(captchaSlice, reducerState => {
  return reducerState.captchaRequested
})

export const siteKey = createSelector(captchaSlice, reducerState => {
  return reducerState.siteKey
})

export const captchaSelectors = {
  captchaRequested,
  siteKey,
}
