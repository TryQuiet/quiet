import { UserProfile } from '@quiet/types'
import React, { SetStateAction } from 'react'

export interface SelectableListOption {
  id: string
  label: string
  selected: boolean
  index: number
  mutable: boolean
  hide: boolean
}

export interface UpdateChannelMembershipListProps {
  options: SelectableListOption[] | undefined
  setOptions: React.Dispatch<SetStateAction<SelectableListOption[] | undefined>>
  visibleOptionsIndices: Set<number> | undefined
  userProfiles: Record<string, UserProfile>
  channelId: string
}
