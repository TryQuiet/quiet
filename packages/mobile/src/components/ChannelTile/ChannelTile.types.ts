export interface ChannelTileProps {
  name: string
  id: string
  unread: boolean
  message?: string
  date?: string
  redirect: (id: string) => void
  nickname: string
}
