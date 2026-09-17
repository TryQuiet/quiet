import { UserProfile } from '@quiet/types'

export interface UserSearchProps {
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  placeholderText: string
  handleInputChange: (selectedUsers: UserProfile[]) => void
  /** Recipients already chosen when the composer opens — a DM started from someone's profile. */
  initialMemberIds?: string[]
}

export interface UserSearchFuzzyProps {
  me: UserProfile | undefined
  placeholderText: string
  options: SelectableListOption[]
  setOptions: (options: SelectableListOption[]) => void
  handleInputChange: (selectedOptions: SelectableListOption[]) => void
}

export interface SelectableListOption {
  id: string
  label: string
  selected: boolean
  index: number
  mutable: boolean
  hide: boolean
}
