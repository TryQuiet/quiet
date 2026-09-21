import { Alert } from 'react-native'

import { InvitationDataVersion, type DeviceInvitationData, type LinkDevicePayload } from '@quiet/types'

export const getDeviceLinkConfirmationMessage = (inviteData: DeviceInvitationData): string => {
  if (inviteData.version === InvitationDataVersion.v5 && inviteData.qssEnabled) {
    return [
      'Quiet will contact this server directly:',
      inviteData.qssEndpoint,
      '',
      'That server can see your IP address. Continue only if you trust this endpoint and the person who shared the link.',
    ].join('\n')
  }

  return 'Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the link.'
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
        text: 'Link device',
        onPress: () => resolve(confirmedDeviceLinkPayload(inviteData)),
      },
      {
        text: 'No thanks',
        style: 'cancel',
        onPress: () => resolve(null),
      },
    ])
  })
