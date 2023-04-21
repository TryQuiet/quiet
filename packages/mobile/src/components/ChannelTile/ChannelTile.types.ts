export interface ChannelTileProps {
  name: string
  address: string
  unread: boolean
  message?: string
  date?: string
  enableDeletion?: boolean
  redirect: (address: string) => void
}
