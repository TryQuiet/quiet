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
  /** Back-arrow handler; used instead of setStep(step - 1) when given. */
  handleBack?: () => void
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
  /**
   * The header zone stays (60px, the back/close glyph at its designed place) but
   * carries no title text and no hairline: the screen's large heading is its
   * title. Full-screen h1 stages of the onboarding (ONBOARDING.md, "No top bar
   * title on full-screen h1 stages"); the prototype hides the frame's title
   * text on them and keeps titled bars only on sheets.
   */
  withoutTitle?: boolean
  zIndex?: number
}
