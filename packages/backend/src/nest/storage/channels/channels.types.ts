import type { PublicChannel } from '@quiet/types'

export interface GetChannelsFilters {
  public: boolean
  private: boolean
}

export interface PrivateChannelMappings {
  roleNameToChannel: { [roleName: string]: PublicChannel }
  idToRoleName: { [channelId: string]: string }
}
