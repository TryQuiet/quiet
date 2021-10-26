import { UsernameErrors, FieldErrors, CommunityNameErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const userNameField = (name = 'userName'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Type name'
    },
    validation: {
      required: FieldErrors.Required,
      minLength: {
        value: 3,
        message: UsernameErrors.NameToShort
      },
      maxLength: {
        value: 20,
        message: UsernameErrors.NameToLong
      },
      pattern: {
        value: /^[a-z0-9]+$/g,
        message: UsernameErrors.WrongCharacter
      }
    }
  }
}

export const communityNameField = (name = 'communityName'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Type name'
    },
    validation: {
      required: FieldErrors.Required,
      minLength: {
        value: 3,
        message: CommunityNameErrors.NameToShort
      },
      maxLength: {
        value: 20,
        message: CommunityNameErrors.NameToLong
      },
      pattern: {
        value: /^[a-z0-9]+$/g,
        message: CommunityNameErrors.WrongCharacter
      }
    }
  }
}
