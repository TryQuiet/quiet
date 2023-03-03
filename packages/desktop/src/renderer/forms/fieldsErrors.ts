export enum FieldErrors {
  Required = 'Required field',
  Whitespaces = 'Name cannot begin with whitespaces or dashes'
}

export enum UsernameErrors {
  NameTooLong = 'Username must have less than 20 characters',
  WrongCharacter = 'Username must be lowercase and cannot contain any special characters'
}

export enum CommunityNameErrors {
  NameTooLong = 'Community name must have less than 20 characters',
  WrongCharacter = 'Community name must be lowercase and cannot contain any special characters'
}

export enum InviteLinkErrors {
  WrongCharacter = 'Please check your invitation code and try again',
  ValueTooLong = 'Invitation code is too long',
  ValueTooShort = 'Invitation code is too short'
}

export enum ChannelNameErrors {
  NameTooLong = 'Channel name must have less than 20 characters',
  WrongCharacter = 'Channel name cannot contain any special characters'
}
