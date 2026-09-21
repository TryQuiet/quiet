import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { validInvitationDatav5 } from '@quiet/common'
import { InvitationKind, type DeviceInvitationDataV5 } from '@quiet/types'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { DeviceLinkConsent } from './DeviceLinkConsent.component'

describe('DeviceLinkConsent', () => {
  const inviteData: DeviceInvitationDataV5 = {
    ...validInvitationDatav5[0],
    kind: InvitationKind.Device,
    authData: { ...validInvitationDatav5[0].authData, userId: 'user-id', userName: 'alice' },
    qssEnabled: true,
  }

  it('shows the direct endpoint disclosure and requires an explicit decision', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    const result = renderComponent(
      <DeviceLinkConsent inviteData={inviteData} visible onConfirm={onConfirm} onCancel={onCancel} />
    )

    expect(result.getByTestId('device-link-consent')).toBeTruthy()
    expect(result.getByText('Link this device?')).toBeTruthy()
    expect(result.getByText(new RegExp(inviteData.qssEndpoint))).toBeTruthy()
    expect(result.getByText(/server can see your IP address/)).toBeTruthy()

    fireEvent.press(result.getByTestId('device-link-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()

    fireEvent.press(result.getByTestId('device-link-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
