"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteLinkField = exports.communityNameField = void 0;
const fieldsErrors_1 = require("../fieldsErrors");
const communityNameField = (name = 'name') => {
    return {
        fieldProps: {
            label: '',
            name,
            type: 'text',
            placeholder: 'Community name'
        },
        validation: {
            required: fieldsErrors_1.FieldErrors.Required,
            minLength: {
                value: 3,
                message: fieldsErrors_1.CommunityNameErrors.NameToShort
            },
            maxLength: {
                value: 20,
                message: fieldsErrors_1.CommunityNameErrors.NameTooLong
            },
            pattern: {
                value: /^[a-z0-9]+$/g,
                message: fieldsErrors_1.CommunityNameErrors.WrongCharacter
            }
        }
    };
};
exports.communityNameField = communityNameField;
const inviteLinkField = (name = 'name') => {
    return {
        fieldProps: {
            label: '',
            name,
            type: 'text',
            placeholder: 'Invite link'
        },
        validation: {
            required: fieldsErrors_1.FieldErrors.Required,
            pattern: {
                value: /^[a-z0-9]{56}$/g,
                message: fieldsErrors_1.InviteLinkErrors.WrongCharacter
            }
        }
    };
};
exports.inviteLinkField = inviteLinkField;
