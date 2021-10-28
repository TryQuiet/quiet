import { FieldErrors, ChannelNameErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const channelNameField = (name = 'channelName'): FieldData => {
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
        message: ChannelNameErrors.NameToShort
      },
      maxLength: {
        value: 20,
        message: ChannelNameErrors.NameTooLong
      },
      pattern: {
        value: /^[a-z0-9]+$/g,
        message: ChannelNameErrors.WrongCharacter
      }
    }
  }
}
