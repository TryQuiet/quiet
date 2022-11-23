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
      maxLength: {
        value: 20,
        message: ChannelNameErrors.NameTooLong
      },
      pattern: {
        value: /^[-a-zA-Z0-9 ]+$/g,
        message: ChannelNameErrors.WrongCharacter
      },
      validate: {
        whitespaces: (value) => /^(?![\s-])[\w\s-]+$/.test(value) || FieldErrors.Whitespaces
      }
    }
  };
}
