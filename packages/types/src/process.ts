export type SupportedPlatformDesktop = 'darwin' | 'linux' | 'win32'

export type SupportedPlatform = SupportedPlatformDesktop | 'android'

export interface BackendLeaveCommunityMessage {
  type: 'leftCommunity'
  requestId: string
  success: boolean
}

export interface BackendLeaveCommunityRequest {
  type: 'leaveCommunity'
  requestId: string
}
