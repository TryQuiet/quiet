export type CommunityId = string
export type RegistrarId = string

export interface NetworkDataPayload {
    peer: string
    connectionDuration: number
    lastSeen: number
}
