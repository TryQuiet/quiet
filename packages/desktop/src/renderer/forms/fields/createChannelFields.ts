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

export const channelPublicPrivateField = (name: 'public' | 'private' = 'public'): FieldData => {
  return {
    fieldProps: {
      label: '',
      name,
      type: 'string',
      placeholder: 'Select the desired channel visibility',
    },
    validation: {
      required: FieldErrors.Required,
      pattern: {
        value: /^(\btrue\b|\bfalse\b)$/g,
        message: ChannelPublicPrivateErrors.InvalidValue,
      },
    },
  }
}
