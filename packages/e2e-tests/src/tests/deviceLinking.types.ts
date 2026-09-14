import type { App } from '../selectors'
import type { UserTestData } from '../types'

type PrimaryMessages = {
  beforeLinking: string
  fromPrimaryDevice: string
  fromLinkedDevice: string
}

type MemberMessages = {
  afterJoining: string
}

export type DeviceLinkingUsers = {
  primary: UserTestData<PrimaryMessages>
  linkedDevice: {
    app: App
  }
  member: UserTestData<MemberMessages>
}
