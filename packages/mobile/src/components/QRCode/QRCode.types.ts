import type { MutableRefObject } from 'react'

export interface QRCodeProps {
  value: string
  svgRef?: MutableRefObject<any>
  shareCode: () => void
  handleBackButton: () => void
  title?: string
  description?: string
}
