export interface ChannelTileProps {
  name: string
  id: string
  unread: boolean
  isPublic: boolean
  redirect: (id: string) => void
}
