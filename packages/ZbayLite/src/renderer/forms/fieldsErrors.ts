export enum FieldErrors {
  Required = 'Required field',
}

export enum UsernameErrors {
  NameToShort = 'Username must have at least 3 characters',
  NameToLong = 'Username must have less than 20 characters',
  WrongCharacter = 'Username must be lowercase and cannot contain any special characters'
}

export enum CommunityNameErrors {
  NameToShort = 'Community name must have at least 3 characters',
  NameToLong = 'Community name must have less than 20 characters',
  WrongCharacter = 'Community name must be lowercase and cannot contain any special characters'
}

export enum ChannelNameErrors {
  NameToShort = 'Channel name must have at least 3 characters',
  NameToLong = 'Channel name must have less than 20 characters',
  WrongCharacter = 'Channel name must be lowercase and cannot contain any special characters'
}
