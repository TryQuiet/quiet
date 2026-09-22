import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { RecoverAccountComponent } from './RecoverAccountComponent'
import { RECOVER_ACCOUNT_HEADING } from '@quiet/common'

describe('Recover account', () => {
  it("shows the frame's copy, routes its two wired rows and omits More options", async () => {
    const { store } = await prepareStore()
    const onUseLinkedDevice = jest.fn()
    const onUseInviteLink = jest.fn()

    renderComponent(
      <RecoverAccountComponent onUseLinkedDevice={onUseLinkedDevice} onUseInviteLink={onUseInviteLink} />,
      store
    )

    expect(screen.getByRole('heading', { name: RECOVER_ACCOUNT_HEADING, level: 3 })).toBeVisible()
    expect(
      screen.getByText('Locked out? You can recover with a linked device or ask an admin to send you an invite link.')
    ).toBeVisible()

    await userEvent.click(screen.getByTestId('recover-use-linked-device'))
    expect(onUseLinkedDevice).toHaveBeenCalledTimes(1)
    expect(onUseInviteLink).not.toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('recover-use-invite-link'))
    expect(onUseInviteLink).toHaveBeenCalledTimes(1)

    // The frame draws a "More options" row with no target; it is omitted until the design gives it one
    expect(screen.queryByTestId('recover-more-options')).not.toBeInTheDocument()
    expect(screen.queryByText('More options')).not.toBeInTheDocument()
  })
})
