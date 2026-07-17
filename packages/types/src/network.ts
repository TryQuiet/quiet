export enum LoadingPanelType {
  StartingApplication = 'Starting Quiet',
  Joining = 'Connecting to peers',
  Creating = 'Creating community',
  Failed = 'Failed',
}

export type InvitationPair = {
  peerId: string
  onionAddress: string
}

export enum InvitationDataVersion {
  v1 = 'v1', // DEPRECATED: classic non-LFA invites
  v2 = 'v2', // DEPRECATED: LFA invites
  v3 = 'v3', // DEPRECATED: LFA + QSS invites
  v4 = 'v4', // LFA invites with guaranteed team ID
  v5 = 'v5', // LFA + QSS invites with guaranteed team ID
}

export type InvitationDataP2P = {
  pairs: InvitationPair[]
  psk: string
}

export type InvitationDataV1 = InvitationDataP2P & {
  ownerOrbitDbIdentity: string
  version: InvitationDataVersion.v1
}

export type InvitationAuthData = {
  communityName: string
  seed: string
  teamId?: string
  salt?: string
}

// P2P auth data v4
export type InvitationAuthDataV4 = {
  communityName: string
  seed: string
  teamId: string
}

// QSS auth data v5
export type InvitationAuthDataV5 = InvitationAuthDataV4 & {
  salt: string
}

export type InvitationDataV2 = InvitationDataP2P & {
  version: InvitationDataVersion.v2
  authData: InvitationAuthData
}

export type InvitationDataV3 = InvitationDataP2P & {
  version: InvitationDataVersion.v3
  authData: InvitationAuthData
  qssEnabled: boolean
  qssEndpoint: string
}

// P2P invite data v4
export type InvitationDataV4 = InvitationDataP2P & {
  version: InvitationDataVersion.v4
  authData: InvitationAuthDataV4
}

// QSS invite data v5
export type InvitationDataV5 = InvitationDataP2P & {
  version: InvitationDataVersion.v5
  authData: InvitationAuthDataV5
  qssEnabled: boolean
  qssEndpoint: string
}

export type InvitationData = InvitationDataV4 | InvitationDataV5

/**
 * Validation types
 */

// Named parameters

export type InvitationLinkUrlNamedParamValidatorFun<T> = (value: string, ...args: any[]) => Partial<T> | never
export type InvitationLinkUrlNamedParamProcessorFun<T> = (value: string, ...args: any[]) => T
export type InvitationLinkUrlNamedParamConfigMap<T> = Map<string, InvitationLinkUrlNamedParamConfig<T | any>>

export type InvitationLinkUrlNamedParamConfig<T> = {
  required: boolean
  validator: InvitationLinkUrlNamedParamValidatorFun<T | string>
  nested?:
    | {
        key: string
        config: InvitationLinkUrlNamedParamConfigMap<any>
      }
    | undefined
}

// Parent type

export type VersionedInvitationLinkUrlParamConfig<T extends InvitationData> = {
  version: InvitationDataVersion
  named: InvitationLinkUrlNamedParamConfigMap<T | any>
}
