import React from 'react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'

import { SidebarHeader } from './SidebarHeader'
import { sidebarMetrics } from './sidebarMetrics'

describe('SidebarHeader', () => {
  it('renders the title and the section action', () => {
    const result = renderComponent(
      <SidebarHeader title='Channels' action={jest.fn()} actionTitle='createChannel' tooltipText='Create new channel' />
    )
    expect(result.baseElement).toMatchSnapshot()
  })

  it('leaves the action out when the user may not add to the section', () => {
    renderComponent(<SidebarHeader title='Users' tooltipText='List of users in this workspace' />)

    expect(screen.getByText('Users')).not.toBeNull()
    expect(screen.queryByTestId('sidebar-button-createChannel')).toBeNull()
  })

  it('calls the action when the plus is clicked', async () => {
    const action = jest.fn()
    renderComponent(
      <SidebarHeader title='Channels' action={action} actionTitle='createChannel' tooltipText='Create new channel' />
    )

    await userEvent.click(screen.getByTestId('sidebar-button-createChannel'))

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('names the action in the test id, so each addable section has its own (+)', () => {
    renderComponent(
      <SidebarHeader title='Direct messages' action={jest.fn()} actionTitle='createNewMessage' tooltipText='Start a new DM' />
    )

    expect(screen.getByTestId('sidebar-button-createNewMessage')).not.toBeNull()
    expect(screen.queryByTestId('sidebar-button-createChannel')).toBeNull()
  })

  it('uses the library row height, so titles and rows share a rhythm', () => {
    // `List title` 3797:16103 - 26px tall, 3px/16px padding.
    expect(sidebarMetrics.title.height).toEqual(sidebarMetrics.row.height)
    expect(sidebarMetrics.title.paddingX).toEqual(sidebarMetrics.row.paddingX)
  })
})
