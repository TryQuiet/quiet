import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { type DeviceInvitationDataV4, type InvitationDataV4, InvitationKind } from '@quiet/types'
import { getValidInvitationUrlTestData, validInvitationDatav4 } from '@quiet/common'

import { renderComponent } from '../../testUtils/renderComponent'
import { InviteLinkErrors } from '../../forms/fieldsErrors'
import { PasteLinkComponent } from './PasteLinkComponent'

const memberInvitationData: InvitationDataV4 = { ...validInvitationDatav4[0], kind: InvitationKind.Member }
const memberLink = getValidInvitationUrlTestData(validInvitationDatav4[0]).shareUrl()

const deviceInvitationData: DeviceInvitationDataV4 = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: { ...validInvitationDatav4[0].authData, userId: 'device-owner-id', userName: 'device-owner' },
}
const deviceLink = getValidInvitationUrlTestData(deviceInvitationData).shareUrl()

const paste = async (link: string) => {
  await userEvent.type(screen.getByPlaceholderText('Link'), link)
  await userEvent.click(screen.getByTestId('continue-joinCommunity'))
}

describe('PasteLinkComponent', () => {
  it('passes a parsed member link to the caller', async () => {
    const handleCommunityAction = jest.fn()
    renderComponent(
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />
    )

    await paste(memberLink)
    expect(handleCommunityAction).toHaveBeenCalledWith(memberInvitationData)
  })

  it('passes a parsed device link to the caller', async () => {
    const handleCommunityAction = jest.fn()
    renderComponent(
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />
    )

    await paste(deviceLink)
    expect(handleCommunityAction).toHaveBeenCalledWith(deviceInvitationData)
  })

  it('shows the invalid-code error for text that is not an invitation', async () => {
    const handleCommunityAction = jest.fn()
    renderComponent(
      <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={handleCommunityAction} />
    )

    await paste('https://example.com/')
    expect(await screen.findByText(InviteLinkErrors.InvalidCode)).toBeVisible()
    expect(handleCommunityAction).not.toHaveBeenCalled()
  })

  describe("linkKind 'device'", () => {
    it('rejects a member link with the not-a-device-link error and does not call the caller', async () => {
      const handleCommunityAction = jest.fn()
      renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          linkKind='device'
          handleCommunityAction={handleCommunityAction}
        />
      )

      await paste(memberLink)
      expect(await screen.findByText(InviteLinkErrors.NotDeviceLink)).toBeVisible()
      expect(handleCommunityAction).not.toHaveBeenCalled()
    })

    it('passes a device link to the caller', async () => {
      const handleCommunityAction = jest.fn()
      renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          linkKind='device'
          handleCommunityAction={handleCommunityAction}
        />
      )

      await paste(deviceLink)
      expect(handleCommunityAction).toHaveBeenCalledWith(deviceInvitationData)
      expect(screen.queryByText(InviteLinkErrors.NotDeviceLink)).not.toBeInTheDocument()
    })

    it('still shows the invalid-code error for text that is not an invitation', async () => {
      const handleCommunityAction = jest.fn()
      renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          linkKind='device'
          handleCommunityAction={handleCommunityAction}
        />
      )

      await paste('not a link')
      expect(await screen.findByText(InviteLinkErrors.InvalidCode)).toBeVisible()
      expect(handleCommunityAction).not.toHaveBeenCalled()
    })
  })
})
