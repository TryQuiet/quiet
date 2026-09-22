import { FileMetadata } from '@quiet/types'

export interface Recipient {
  userId: string
  label: string
  photo?: string
  profilePhoto?: FileMetadata
}

export interface RecipientFieldProps {
  recipients: Recipient[]
  query: string | undefined
  placeholder: string
  onChangeQuery: (value: string) => void
  onRemoveRecipient: (userId: string) => void
  validation?: string
  testID?: string
}
