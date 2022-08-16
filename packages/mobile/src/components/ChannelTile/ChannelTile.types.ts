export interface ChannelTileProps {
    name: string
    address: string
    message: string
    date: string
    unread: boolean
    redirect: (address: string) => void
}
