import { ConnectionProcessInfo } from '@quiet/types'

export interface ConnectionProcessComponentProps {
  connectionProcess: { number: number; text: ConnectionProcessInfo }
  openUrl: (url: string) => void
  /** Whether this community is hosted on a server (QSS) rather than reached over Tor alone. */
  usesServer?: boolean
}
