import { FieldErrors, CommunityNameErrors, InviteLinkErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const communityNameField = (name = 'name'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Community name'
    },
    validation: {
      required: FieldErrors.Required,
      minLength: {
        value: 3,
        message: CommunityNameErrors.NameToShort
      },
      maxLength: {
        value: 20,
        message: CommunityNameErrors.NameTooLong
      },
      pattern: {
        value: /^[a-z0-9]+$/g,
        message: CommunityNameErrors.WrongCharacter
      }
    }
  }
}

export const inviteLinkField = (name = 'name'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Invite link'
    },
    validation: {
      required: FieldErrors.Required,
      pattern: {
        value: /^[a-z0-9]{56}$/g,
        message: InviteLinkErrors.WrongCharacter
      }
    }
  }
}
