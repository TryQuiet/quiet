import { FieldErrors, UsernameErrors } from '../fieldsErrors'
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
        message: UsernameErrors.NameTooLong
      },
      pattern: {
        value: /^[a-z0-9]+$/g,
        message: UsernameErrors.WrongCharacter
      }
    }
  }
}
