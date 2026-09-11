export interface QRCodeProps {
  value: string
  svgRef?: any
  shareCode: () => void
  handleBackButton: () => void
  title?: string
  description?: string
}
