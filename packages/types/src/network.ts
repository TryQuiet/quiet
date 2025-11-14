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
  v1 = 'v1', // classic non-LFA invites
  v2 = 'v2', // LFA invites
  v3 = 'v3', // LFA + QSS invites
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

export type InvitationData = InvitationDataV1 | InvitationDataV2 | InvitationDataV3

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
