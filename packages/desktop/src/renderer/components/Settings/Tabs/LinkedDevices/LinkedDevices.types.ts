export interface LinkedDevicesComponentProps {
  deviceLink: string
  isLoading: boolean
  revealLink: boolean
  onToggleLinkVisibility: () => void
  /** Inside the onboarding modal: centered heading and content, per the layout canon. */
  centered?: boolean
}
