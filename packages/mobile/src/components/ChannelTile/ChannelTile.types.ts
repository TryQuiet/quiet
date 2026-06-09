export interface ChannelTileProps {
  name: string
  id: string
  unread: boolean
  message?: string
  date?: string
  isPublic: boolean
  redirect: (id: string) => void
}
