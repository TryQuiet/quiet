export interface ConnectionProcessComponentProps {
  connectionProcess: { number: number; text: string }
  openUrl: (url: string) => void
}
