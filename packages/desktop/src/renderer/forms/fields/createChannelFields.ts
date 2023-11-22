import { FieldErrors, ChannelNameErrors } from '../fieldsErrors'
import { FieldData } from '../types'

export const channelNameField = (name = 'channelName'): FieldData => {
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
                message: ChannelNameErrors.NameTooLong,
            },
            /* eslint-disable */
      validate: {
        whitespaces: value =>
          /^(?![\s-])[\w&\/\\#\]\[,+()!@$%^&*=_~`.'":;|?<>{}\s-]+$/.test(value) ||
          FieldErrors.Whitespaces
      }
    }
  }
}
