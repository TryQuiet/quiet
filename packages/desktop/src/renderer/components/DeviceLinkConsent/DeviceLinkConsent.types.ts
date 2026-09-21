export interface DeviceLinkConsentArgs {
  qssEndpoint?: string
}

export interface DeviceLinkConsentComponentProps extends DeviceLinkConsentArgs {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}
