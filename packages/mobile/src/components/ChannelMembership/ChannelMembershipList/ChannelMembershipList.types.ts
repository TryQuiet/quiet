import React, { SetStateAction } from 'react'

import { UserProfile } from '@quiet/types'

export interface SelectableListOption {
  id: string
  label: string
  index: number
  selected: boolean
  mutable: boolean
}

export interface ChannelMembershipListProps {
  options: SelectableListOption[]
  setOptions: React.Dispatch<SetStateAction<SelectableListOption[]>>
  userProfiles: Record<string, UserProfile>
  channelId: string
}
