import { FieldErrors, CommunityNameErrors, InviteLinkErrors } from '../fieldsErrors'
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
      pattern: {
        value: /^[-a-zA-Z0-9 ]+$/g,
        message: CommunityNameErrors.WrongCharacter,
      },
      validate: {
        whitespaces: value => /^(?![\s-])[\w\s-]+$/.test(value) || FieldErrors.Whitespaces,
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
      placeholder: 'Invite code',
    },
    validation: {
      required: FieldErrors.Required,
    },
  }
}
