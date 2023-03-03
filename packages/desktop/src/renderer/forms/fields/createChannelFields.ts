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
      validate: {
        whitespaces: value =>
          /^(?![\s-])(?<![\s-])[\w\`\~\!\@\#\$\%\^\&\*\(\)\+\=\[\{\]\}\|\\\'\<\,\.\>\?\/\"\;\:\s-]+$/.test(
            value
          ) || FieldErrors.Whitespaces
      }
    }
  }
}
