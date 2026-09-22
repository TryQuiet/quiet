import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { RecoverAccountComponent } from './RecoverAccountComponent'

describe('Recover account', () => {
  it("shows the frame's copy, routes its two wired rows and keeps More options inert", async () => {
    const { store } = await prepareStore()
    const onUseLinkedDevice = jest.fn()
    const onUseInviteLink = jest.fn()

    renderComponent(
      <RecoverAccountComponent onUseLinkedDevice={onUseLinkedDevice} onUseInviteLink={onUseInviteLink} />,
      store
    )

    expect(screen.getByRole('heading', { name: 'Recover account', level: 3 })).toBeVisible()
    expect(
      screen.getByText('Locked out? You can recover with a linked device or ask an admin to send you an invite link.')
    ).toBeVisible()

    await userEvent.click(screen.getByTestId('recover-use-linked-device'))
    expect(onUseLinkedDevice).toHaveBeenCalledTimes(1)
    expect(onUseInviteLink).not.toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('recover-use-invite-link'))
    expect(onUseInviteLink).toHaveBeenCalledTimes(1)

    expect(screen.getByTestId('recover-more-options')).toHaveAttribute('aria-disabled', 'true')
  })
})
