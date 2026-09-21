import { UserProfile } from '@quiet/types'
import React, { SetStateAction } from 'react'
import type { DmChannelUserData } from '../../ProfilePhoto/ProfilePhoto.types'

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
  nonMembers: Record<string, DmChannelUserData>
  channelId: string
  maxVisibleOptions?: number
}
