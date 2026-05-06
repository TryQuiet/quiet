export interface ModalBottomDrawerProps {
  visible: boolean
  onClose: () => void
  title?: string
  showHandle?: boolean
  children?: React.ReactNode
  testIdPrefix?: string
  heightRatio?: number
  heightPx?: number
}
