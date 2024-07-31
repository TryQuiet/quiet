import { FieldErrors, CommunityNameErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const communityNameField = (name = 'name'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Community name',
    },
    validation: {
      required: FieldErrors.Required,
      maxLength: {
        value: 20,
        message: CommunityNameErrors.NameTooLong,
      },
    },
  }
}

export const inviteLinkField = (name = 'name'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'password',
      placeholder: 'Invite link',
    },
    validation: {
      required: FieldErrors.Required,
    },
  }
}
