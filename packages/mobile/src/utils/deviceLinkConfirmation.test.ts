import { Alert } from 'react-native'

import { validInvitationDatav4, validInvitationDatav5 } from '@quiet/common'
import { InvitationKind, type DeviceInvitationDataV4, type DeviceInvitationDataV5 } from '@quiet/types'

import {
  confirmDeviceLink,
  confirmedDeviceLinkPayload,
  getDeviceLinkConfirmationMessage,
} from './deviceLinkConfirmation'

describe('device link confirmation', () => {
  const p2pInvite: DeviceInvitationDataV4 = {
    ...validInvitationDatav4[0],
    kind: InvitationKind.Device,
    authData: { ...validInvitationDatav4[0].authData, userId: 'user-id', userName: 'alice' },
  }
  const qssInvite: DeviceInvitationDataV5 = {
    ...validInvitationDatav5[0],
    kind: InvitationKind.Device,
    authData: { ...validInvitationDatav5[0].authData, userId: 'user-id', userName: 'alice' },
    qssEnabled: true,
  }

  afterEach(() => jest.restoreAllMocks())

  it('shows the exact QSS endpoint and direct IP disclosure', () => {
    const message = getDeviceLinkConfirmationMessage(qssInvite)

    expect(message).toContain(qssInvite.qssEndpoint)
    expect(message).toContain('contact this server directly')
    expect(message).toContain('IP address')
  })

  it('echoes the confirmed endpoint only after linking the device', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.text === 'Link device')?.onPress?.()
    })

    await expect(confirmDeviceLink(qssInvite)).resolves.toEqual(confirmedDeviceLinkPayload(qssInvite))
  })

  it('resolves cancellation without producing a link payload', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.text === 'No thanks')?.onPress?.()
    })

    await expect(confirmDeviceLink(p2pInvite)).resolves.toBeNull()
  })
})
