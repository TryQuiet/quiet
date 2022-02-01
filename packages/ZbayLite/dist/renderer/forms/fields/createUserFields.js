"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNameField = void 0;
const fieldsErrors_1 = require("../fieldsErrors");
const userNameField = (name = 'userName') => {
    return {
        fieldProps: {
            label: '',
            name,
            type: 'text',
            placeholder: 'Type name'
        },
        validation: {
            required: fieldsErrors_1.FieldErrors.Required,
            minLength: {
                value: 3,
                message: fieldsErrors_1.UsernameErrors.NameToShort
            },
            maxLength: {
                value: 20,
                message: fieldsErrors_1.UsernameErrors.NameTooLong
            },
            pattern: {
                value: /^[a-z0-9]+$/g,
                message: fieldsErrors_1.UsernameErrors.WrongCharacter
            }
        }
    };
};
exports.userNameField = userNameField;
