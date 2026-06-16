import { UserProfile } from '@quiet/types'
import crypto from 'crypto'

export const generateChannelId = (channelName: string) => `${channelName}_${crypto.randomBytes(16).toString('hex')}`

export const generateDmChannelId = (memberIds: string[]) =>
  crypto
    .createHash('sha256')
    .update([...new Set(memberIds)].sort().toString())
    .digest()
    .toString('base64')

export const getChannelNameFromChannelId = (channelId: string) => {
  const index = channelId.indexOf('_')
  if (index === -1) {
    return channelId
  } else {
    return channelId.substring(0, index)
  }
}

export const generateDmChannelName = (
  memberIds: string[] | undefined,
  userProfiles: Record<string, UserProfile>,
  me: UserProfile | undefined
): string => {
  if (memberIds == null) return 'Empty DM Channel Name'
  if (memberIds.length === 1) {
    return me?.nickname ?? 'Me'
  }

  return memberIds
    .filter(id => id !== me?.userId)
    .map(id => userProfiles[id]?.nickname)
    .sort()
    .join(', ')
}
