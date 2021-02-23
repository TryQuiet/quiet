import { ModalProps } from '@material-ui/core/Modal'

export interface IModalProps {
  open: boolean
  handleClose: ModalProps['onClose']
  title?: string
  canGoBack?: boolean
  isBold: boolean
  step: number
  setStep: (arg0?: any) => void
  contentWidth?: string | number
  isCloseDisabled?: boolean
  alignCloseLeft: boolean
  addBorder: boolean
}
