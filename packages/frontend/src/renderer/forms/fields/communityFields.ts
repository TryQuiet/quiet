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
        value: 1,
        message: CommunityNameErrors.NameToShort
      },
      maxLength: {
        value: 20,
        message: CommunityNameErrors.NameTooLong
      },
      pattern: {
        value: /^[-a-zA-Z0-9 ]+$/g,
        message: CommunityNameErrors.WrongCharacter
      },
      validate: {
        whitespaces: (value) => /^(?![\s-])[\w\s-]+$/.test(value) || FieldErrors.Whitespaces
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
      placeholder: 'Invite code'
    },
    validation: {
      required: FieldErrors.Required,
      pattern: {
        value: /^[a-z0-9]{56}$/g,
        message: InviteLinkErrors.WrongCharacter
      },
      validate: {
        whitespaces: (value) => /^(?![\s-])[\w\s-]+$/.test(value) || FieldErrors.Whitespaces
      }
    }
  }
}
