"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelNameErrors = exports.InviteLinkErrors = exports.CommunityNameErrors = exports.UsernameErrors = exports.FieldErrors = void 0;
var FieldErrors;
(function (FieldErrors) {
    FieldErrors["Required"] = "Required field";
})(FieldErrors = exports.FieldErrors || (exports.FieldErrors = {}));
var UsernameErrors;
(function (UsernameErrors) {
    UsernameErrors["NameToShort"] = "Username must have at least 3 characters";
    UsernameErrors["NameTooLong"] = "Username must have less than 20 characters";
    UsernameErrors["WrongCharacter"] = "Username must be lowercase and cannot contain any special characters";
})(UsernameErrors = exports.UsernameErrors || (exports.UsernameErrors = {}));
var CommunityNameErrors;
(function (CommunityNameErrors) {
    CommunityNameErrors["NameToShort"] = "Community name must have at least 3 characters";
    CommunityNameErrors["NameTooLong"] = "Community name must have less than 20 characters";
    CommunityNameErrors["WrongCharacter"] = "Community name must be lowercase and cannot contain any special characters";
})(CommunityNameErrors = exports.CommunityNameErrors || (exports.CommunityNameErrors = {}));
var InviteLinkErrors;
(function (InviteLinkErrors) {
    InviteLinkErrors["WrongCharacter"] = "Please check your invitation code and try again";
})(InviteLinkErrors = exports.InviteLinkErrors || (exports.InviteLinkErrors = {}));
var ChannelNameErrors;
(function (ChannelNameErrors) {
    ChannelNameErrors["NameToShort"] = "Channel name must have at least 3 characters";
    ChannelNameErrors["NameTooLong"] = "Channel name must have less than 20 characters";
    ChannelNameErrors["WrongCharacter"] = "Channel name cannot contain any special characters";
})(ChannelNameErrors = exports.ChannelNameErrors || (exports.ChannelNameErrors = {}));
