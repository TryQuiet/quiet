import type { PublicChannel } from '@quiet/types'

export interface GetChannelsFilters {
  public: boolean
  private: boolean
  dms: boolean
}

export interface PrivateChannelMappings {
  roleNameToChannel: { [roleName: string]: PublicChannel }
  idToRoleName: { [channelId: string]: string }
}
