export enum FieldErrors {
  Required = 'Required field',
}

export enum UsernameErrors {
  NameTooLong = 'Username must have less than 20 characters',
  WrongCharacter = 'Username must be lowercase and cannot contain any special characters',
  LeadingHyphen = 'Username must start with a letter or number',
}

export enum CommunityNameErrors {
  NameTooLong = 'Community name must have less than 20 characters',
  WrongCharacter = 'Community name must be lowercase and cannot contain any special characters',
}

export enum InviteLinkErrors {
  InvalidCode = 'Please check your invite link and try again',
  /** Link devices -> Paste link rejects anything but a device link. Undesigned copy (user addition, 2026-09-13). */
  NotDeviceLink = 'This is not a device link. Use the link from Link devices on your other device.',
}

export enum ChannelNameErrors {
  NameTooLong = 'Channel name must have less than 20 characters',
  WrongCharacter = 'Channel name cannot contain any special characters',
}

export enum ChannelPublicPrivateErrors {
  InvalidValue = `Invalid value for channel privacy`,
}
