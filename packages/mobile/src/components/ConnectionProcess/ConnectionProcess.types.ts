import { ConnectionProcessInfo } from '@quiet/types'

export interface ConnectionProcessComponentProps {
  connectionProcess: { number: number; text: ConnectionProcessInfo }
  openUrl: (url: string) => void
}
