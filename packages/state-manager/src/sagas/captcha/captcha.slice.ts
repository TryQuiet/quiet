import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { CaptchaContexts, HCaptchaChallengeRequest, HCaptchaRequest, type HCaptchaFormResponse } from '@quiet/types'
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
    presentChallenge: (state, _action: PayloadAction<HCaptchaChallengeRequest>) => {
      state.challengeContext = _action.payload.context ?? CaptchaContexts.DEFAULT
    },
    captchaFormResponse: (state, _action: PayloadAction<HCaptchaFormResponse>) => {},
    setSiteKey: (state, _action: PayloadAction<string>) => {
      state.siteKey = _action.payload
    },
    setCaptchaVerified: (state, _action: PayloadAction<boolean>) => {
      state.captchaVerified = _action.payload
    },
    setCaptchaRequestPending: (state, _action: PayloadAction<boolean>) => {
      state.captchaRequested = _action.payload
    },
    setChallengeResult: (state, _action: PayloadAction<{ success: boolean; cancelled?: boolean }>) => {},
  },
})

export const captchaActions = captchaSlice.actions
export const captchaReducer = captchaSlice.reducer
