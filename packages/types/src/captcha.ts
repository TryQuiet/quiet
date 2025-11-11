export interface HCaptchaFormResponse {
  token?: string
  error?: string
  cancelled?: boolean
}

export interface HCaptchaRequest {
  siteKey: string
}

export interface HCaptchaChallengeRequest {
  context?: CaptchaContexts
}

export enum CaptchaErrorMessages {
  CATCHA_VERIFICATION_REQUIRED = 'Captcha verification required',
}

export enum CaptchaContexts {
  DEFAULT = 'Prove you are human',
  CREATE_COMMUNITY = 'You must complete the captcha to create a community',
  RETRY = 'Please complete the captcha to continue',
  FAILED = 'Captcha verification failed, please try again',
}
