export type SupportedPlatformDesktop = 'darwin' | 'linux' | 'win32'

export type SupportedPlatform = SupportedPlatformDesktop | 'android'

export interface BackendLeaveCommunityMessage {
  type: 'leftCommunity'
  success: boolean
}
