"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelNameField = void 0;
const fieldsErrors_1 = require("../fieldsErrors");
const channelNameField = (name = 'channelName') => {
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
                message: fieldsErrors_1.ChannelNameErrors.NameToShort
            },
            maxLength: {
                value: 20,
                message: fieldsErrors_1.ChannelNameErrors.NameTooLong
            },
            pattern: {
                value: /^[a-zA-Z0-9 ]+$/g,
                message: fieldsErrors_1.ChannelNameErrors.WrongCharacter
            }
        }
    };
};
exports.channelNameField = channelNameField;
