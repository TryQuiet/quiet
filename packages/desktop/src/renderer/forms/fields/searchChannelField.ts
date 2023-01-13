import { FieldErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const searchChannelField = (name = 'searchChannel'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'text',
      placeholder: 'Type name'
    },
    validation: {
      required: FieldErrors.Required
    }
  }
}
