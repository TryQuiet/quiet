import React from 'react'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { Walkthrough } from './PrivateChannelFlow.stories'

/**
 * Covers the Storybook walkthrough as a flow rather than as a static render: from inside a private
 * channel, its "..." menu reaches Add members, and members picked there land in the channel. Keeps
 * the walkthrough honest — a story that renders but whose buttons do nothing would otherwise pass
 * unnoticed.
 */
describe('Private channel walkthrough', () => {
  it('adds members to a private channel through its "..." menu', async () => {
    renderComponent(<Walkthrough />)

    expect(screen.getByText(/Nobody has been added to this private channel yet/)).toBeVisible()

    await userEvent.click(screen.getByTestId('walkthrough-channel-menu'))
    await userEvent.click(await screen.findByTestId('contextMenuItemAdd_members'))

    expect(await screen.findByTestId('addMembersPanelTitle')).toBeVisible()

    await userEvent.click(await screen.findByTestId('fundraising-and-events-add-members-row-denise'))
    // Each pick shows up as a pill in the search box.
    expect(await screen.findByTestId('new-message-recipient-pill-denise')).toBeVisible()

    await userEvent.click(screen.getByTestId('fundraising-and-events-add-members-button'))

    expect(await screen.findByText(/In this channel: denise/)).toBeVisible()
    expect(screen.getByText('1 member')).toBeVisible()
    expect(screen.getByTestId('walkthrough-outcome')).toHaveTextContent(/Confirmed with Done/)
  })

  it('abandons the picks when the panel is closed rather than confirmed', async () => {
    renderComponent(<Walkthrough />)

    await userEvent.click(screen.getByTestId('walkthrough-channel-menu'))
    await userEvent.click(await screen.findByTestId('contextMenuItemAdd_members'))
    await userEvent.click(await screen.findByTestId('fundraising-and-events-add-members-row-denise'))

    await userEvent.click(screen.getByTestId('fundraising-and-events-add-members-leave-button'))

    expect(await screen.findByTestId('walkthrough-outcome')).toHaveTextContent(/nobody was added/)
    expect(screen.getByText('0 members')).toBeVisible()
  })
})
