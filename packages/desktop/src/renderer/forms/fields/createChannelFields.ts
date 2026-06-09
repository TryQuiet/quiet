import { FieldErrors, ChannelNameErrors, ChannelPublicPrivateErrors } from '../fieldsErrors'
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
    },
  }
}

export const channelPrivateField = (name = 'private'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'boolean',
    },
    validation: {
      validate: (value: any) => {
        if (typeof value === 'boolean') {
          return true
        }
        return ChannelPublicPrivateErrors.InvalidValue
      },
    },
  }
}
