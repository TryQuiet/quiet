import React from 'react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'

import { SidebarHeader } from './SidebarHeader'
import { sidebarMetrics } from './sidebarMetrics'

describe('SidebarHeader', () => {
  it('renders the title and the section action', () => {
    const result = renderComponent(
      <SidebarHeader title='Channels' action={jest.fn()} tooltipText='Create new channel' />
    )
    expect(result.baseElement).toMatchSnapshot()
  })

  it('leaves the action out when the user may not add to the section', () => {
    renderComponent(<SidebarHeader title='Users' tooltipText='List of users in this workspace' />)

    expect(screen.getByText('Users')).not.toBeNull()
    expect(screen.queryByTestId('addChannelButton')).toBeNull()
  })

  it('calls the action when the plus is clicked', async () => {
    const action = jest.fn()
    renderComponent(<SidebarHeader title='Channels' action={action} tooltipText='Create new channel' />)

    await userEvent.click(screen.getByTestId('addChannelButton'))

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('uses the library row height, so titles and rows share a rhythm', () => {
    // `List title` 3797:16103 - 26px tall, 3px/16px padding.
    expect(sidebarMetrics.title.height).toEqual(sidebarMetrics.row.height)
    expect(sidebarMetrics.title.paddingX).toEqual(sidebarMetrics.row.paddingX)
  })
})
