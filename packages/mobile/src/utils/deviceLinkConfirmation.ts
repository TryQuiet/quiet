import { Alert } from 'react-native'

import { InvitationDataVersion, type DeviceInvitationData, type LinkDevicePayload } from '@quiet/types'

export const getDeviceLinkConfirmationMessage = (inviteData: DeviceInvitationData): string => {
  if (inviteData.version === InvitationDataVersion.v5 && inviteData.qssEnabled) {
    return [
      'This device link asks Quiet to connect directly to:',
      inviteData.qssEndpoint,
      '',
      'That server can see this device’s IP address. Continue only if you trust the link and this server.',
    ].join('\n')
  }

  return 'This link grants this device access to your Quiet community. Continue only if it came from a device you trust.'
}

export const confirmedDeviceLinkPayload = (inviteData: DeviceInvitationData): LinkDevicePayload => ({
  inviteData,
  deviceLinkConsent: true,
  ...(inviteData.version === InvitationDataVersion.v5 && inviteData.qssEnabled
    ? { confirmedQssEndpoint: inviteData.qssEndpoint }
    : {}),
})

export const confirmDeviceLink = (inviteData: DeviceInvitationData): Promise<LinkDevicePayload | null> =>
  new Promise(resolve => {
    Alert.alert('Link this device?', getDeviceLinkConfirmationMessage(inviteData), [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => resolve(null),
      },
      {
        text: 'Continue',
        onPress: () => resolve(confirmedDeviceLinkPayload(inviteData)),
      },
    ])
  })
