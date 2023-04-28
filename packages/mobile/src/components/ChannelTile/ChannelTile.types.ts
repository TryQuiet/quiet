export interface ChannelTileProps {
  name: string
  address: string
  unread: boolean
  message?: string
  date?: string
  redirect: (address: string) => void
}
