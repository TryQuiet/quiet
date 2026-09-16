import React from 'react'
import '@testing-library/jest-dom'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { Walkthrough } from './PrivateChannelFlow.stories'

/**
 * Covers the Storybook walkthrough as a flow rather than as a static render: a channel can be
 * created from nothing and then opened to manage its membership. Keeps the walkthrough honest — a
 * story that renders but whose buttons do nothing would otherwise pass unnoticed.
 */
describe('Private channel walkthrough', () => {
  it('creates a private channel from nothing and opens membership management for it', async () => {
    renderComponent(<Walkthrough />)

    expect(screen.getByText('No channels yet — create one.')).toBeVisible()

    await userEvent.click(screen.getByTestId('walkthrough-create'))
    expect(await screen.findByTestId('createChannelPanelTitle')).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Enter a channel name'), 'secrets')
    await userEvent.click(screen.getByTestId('createChannel-private-form-control-toggle'))
    await userEvent.click(screen.getByTestId('channelNameSubmit'))

    // The channel now exists in the list, with no members yet.
    expect(await screen.findByText('secrets')).toBeVisible()
    expect(screen.getByText('0 members')).toBeVisible()

    await userEvent.click(screen.getByText('secrets'))
    await waitFor(() => {
      expect(screen.getByText(/Managing membership for/)).toBeVisible()
    })
  })
})
