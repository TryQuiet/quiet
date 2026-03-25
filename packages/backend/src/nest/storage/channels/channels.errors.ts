export class NotAMemberError extends Error {
  constructor() {
    super('Not a member of this channel')
  }
}
