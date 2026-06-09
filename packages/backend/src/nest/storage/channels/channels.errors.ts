export class NotAMemberError extends Error {
  constructor(id?: string) {
    super(`Not a member of this channel: ${id}`)
  }
}
