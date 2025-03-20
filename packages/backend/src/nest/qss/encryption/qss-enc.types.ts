import { CompoundError } from '@quiet/types'

export enum Base64ErrorDirection {
  To = 'to',
  From = 'from',
}

export class EncryptionBase64Error<T extends Error> extends CompoundError<T> {
  constructor(direction: Base64ErrorDirection, original?: T) {
    super(EncryptionBase64Error.chooseMessage(direction), original)
  }

  private static chooseMessage(direction: Base64ErrorDirection): string {
    if (direction === Base64ErrorDirection.To) {
      return `Failed to convert encrypted bytes to base64`
    }

    return `Payload isn't valid base64`
  }
}

export class EncryptionError<T extends Error> extends CompoundError<T> {}
export class DecryptionError<T extends Error> extends CompoundError<T> {}
export class KeyGenError<T extends Error> extends CompoundError<T> {}
