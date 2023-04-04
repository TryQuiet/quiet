import { ModalProps } from '@mui/material/Modal'
import React from 'react'

export interface IModalProps {
  open: boolean
  handleClose: ModalProps['onClose']
  title?: string
  canGoBack?: boolean
  isBold?: boolean
  step?: number
  setStep?: (arg0?: any) => void
  contentWidth?: string | number
  contentHeight?: string | number
  isCloseDisabled?: boolean
  alignCloseLeft?: boolean
  addBorder?: boolean
  fullPage?: boolean
  testIdPrefix?: string
  windowed?: boolean
  fullPage?: boolean
  children?: React.ReactNode
  isTransparent?: boolean
  withoutHeader?: boolean
}
