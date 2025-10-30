export interface HCaptchaFormResponse {
  token?: string
  error?: string
}

export interface HCaptchaRequest {
  siteKey: string
}

export enum CaptchaErrorMessages {
  CATCHA_VERIFICATION_REQUIRED = 'Captcha verification required',
}
