import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { CaptchaContexts, HCaptchaRequest, type HCaptchaFormResponse } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CaptchaSlice')

export class CaptchaState {
  public challengeContext: CaptchaContexts = CaptchaContexts.DEFAULT
  public captchaVerified: boolean = false
  public captchaRequested = false
  public siteKey: string = ''
}

export const captchaSlice = createSlice({
  initialState: { ...new CaptchaState() },
  name: StoreKeys.Captcha,
  reducers: {
    getTokenForSiteKey: (state, _action: PayloadAction<HCaptchaRequest>) => {
      state.captchaRequested = true
      state.siteKey = _action.payload.siteKey
    },
    setHcaptchaFormResponse: (state, _action: PayloadAction<HCaptchaFormResponse>) => {
      state.captchaRequested = false
    },
    setSiteKey: (state, _action: PayloadAction<string>) => {
      state.siteKey = _action.payload
    },
    presentChallenge: (state, _action: PayloadAction<{ context?: CaptchaContexts }>) => {
      state.captchaRequested = true
      state.challengeContext = _action.payload.context ?? CaptchaContexts.DEFAULT
    },
    setCaptchaVerified: (state, _action: PayloadAction<boolean>) => {
      state.captchaVerified = _action.payload
      if (_action.payload) {
        state.captchaRequested = false
      }
    },
  },
})

export const captchaActions = captchaSlice.actions
export const captchaReducer = captchaSlice.reducer
