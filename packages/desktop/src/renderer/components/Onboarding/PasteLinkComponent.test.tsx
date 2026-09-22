import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
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

  /**
   * `fieldError` is how a caller reports what only it can know - the backend's verdict on the
   * link that was submitted. It shares the slot under the input with the errors raised here.
   */
  describe('an error reported by the caller', () => {
    const reported = 'Please check your invite link and try again'

    it('renders under the input', async () => {
      renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          handleCommunityAction={jest.fn()}
          fieldError={reported}
          onFieldChange={jest.fn()}
        />
      )

      const error = await screen.findByText(reported)
      expect(error).toBeVisible()
      expect(screen.getByPlaceholderText('Link').closest('.MuiFormControl-root')?.nextElementSibling).toBe(error)
    })

    it('tells the caller about every keystroke, and goes when the caller withdraws it', async () => {
      const onFieldChange = jest.fn()
      const { rerender } = renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          handleCommunityAction={jest.fn()}
          fieldError={reported}
          onFieldChange={onFieldChange}
        />
      )
      expect(await screen.findByText(reported)).toBeVisible()

      await userEvent.type(screen.getByPlaceholderText('Link'), 'abc')
      expect(onFieldChange).toHaveBeenCalled()

      rerender(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          handleCommunityAction={jest.fn()}
          fieldError={undefined}
          onFieldChange={onFieldChange}
        />
      )

      await waitFor(() => expect(screen.queryByText(reported)).not.toBeInTheDocument())
      expect(screen.getByPlaceholderText('Link')).toHaveValue('abc')
    })

    it('does not clobber an error this form raised itself', async () => {
      renderComponent(
        <PasteLinkComponent
          heading={'Paste a link to join'}
          handleCommunityAction={jest.fn()}
          fieldError={undefined}
          onFieldChange={jest.fn()}
        />
      )

      await paste('not an invitation')

      expect(await screen.findByText(InviteLinkErrors.InvalidCode)).toBeVisible()
    })
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
