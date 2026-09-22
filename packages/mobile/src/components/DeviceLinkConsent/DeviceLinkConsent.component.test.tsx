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
    expect(result.getByText(new RegExp(inviteData.qssEndpoint))).toBeTruthy()
    expect(result.getByText(/server can see your IP address/)).toBeTruthy()

    fireEvent.press(result.getByTestId('device-link-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  // The design (3054:4090) gives this step the Agree & join screen: a titled bar with a back
  // arrow, and one pill. There is no second button — declining is the back arrow.
  it('is the Agree & join screen: a titled bar whose back arrow declines, and one button', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    const result = renderComponent(
      <DeviceLinkConsent inviteData={inviteData} visible onConfirm={onConfirm} onCancel={onCancel} />
    )

    expect(result.getByText('Agree & join')).toBeTruthy()
    expect(result.queryByText('Link this device?')).toBeNull()
    expect(result.queryByTestId('device-link-cancel')).toBeNull()

    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('falls back to the Tor wording when the invite carries no endpoint', () => {
    const torOnly = { ...inviteData, qssEnabled: false }
    const result = renderComponent(
      <DeviceLinkConsent inviteData={torOnly} visible onConfirm={jest.fn()} onCancel={jest.fn()} />
    )

    expect(result.getByText(/connect to the linked device over Tor/)).toBeTruthy()
  })
})
