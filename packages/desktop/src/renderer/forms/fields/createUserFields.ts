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
                whitespaces: value => /^(?![\s])[\w\s-]+$/.test(value) || FieldErrors.Whitespaces,
            },
        },
    }
}
