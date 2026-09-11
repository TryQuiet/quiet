import { parseName } from '@quiet/common'

import { FieldErrors, UsernameErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const userNameField = (name = 'userName'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Type name',
    },
    validation: {
      required: FieldErrors.Required,
      maxLength: {
        value: 20,
        message: UsernameErrors.NameTooLong,
      },
      pattern: {
        value: /^[-a-zA-Z0-9 ]+$/g,
        message: UsernameErrors.WrongCharacter,
      },
      validate: {
        // The name that actually gets registered is parseName(value), which turns
        // spaces and other special characters into hyphens. Check that parsed form,
        // so " holmes" (registered as "-holmes") is caught as well as "-holmes".
        leadingCharacter: (value: string) => !parseName(value).startsWith('-') || UsernameErrors.LeadingHyphen,
      },
    },
  }
}
