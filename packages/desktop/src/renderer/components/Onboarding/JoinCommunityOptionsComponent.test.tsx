import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { JoinCommunityOptionsComponent } from './JoinCommunityOptionsComponent'

describe('Join community', () => {
  it("opens with the frame's heart-chat illustration above the heading, then the rows", async () => {
    const { store } = await prepareStore()
    const onJoinWithInviteLink = jest.fn()
    const onJoinWithQrCode = jest.fn()

    renderComponent(
      <JoinCommunityOptionsComponent
        onJoinWithInviteLink={onJoinWithInviteLink}
        onJoinWithQrCode={onJoinWithQrCode}
        onRecoverAccount={jest.fn()}
      />,
      store
    )

    const graphic = screen.getByTestId('join-community-graphic')
    expect(graphic.tagName).toBe('IMG')
    expect(graphic).toHaveAttribute('aria-hidden', 'true')
    const heading = screen.getByRole('heading', { name: 'Join community', level: 3 })
    // Illustration first, heading after it, the rows after that
    expect(graphic.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      heading.compareDocumentPosition(screen.getByTestId('join-with-invite-link')) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    // The graphic sits directly under the bar: no padding above it
    expect(screen.getByTestId('join-community-options')).toHaveClass('OnboardingBodyflushLeading')

    await userEvent.click(screen.getByTestId('join-with-invite-link'))
    await userEvent.click(screen.getByTestId('join-with-qr-code'))
    expect(onJoinWithInviteLink).toHaveBeenCalledTimes(1)
    expect(onJoinWithQrCode).toHaveBeenCalledTimes(1)
  })
})
