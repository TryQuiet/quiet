import React from 'react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../../testUtils/renderComponent'

import SidebarRow from './SidebarRow'
import SidebarUnreadBadge from './SidebarUnreadBadge'
import { lightTheme } from '../../../theme'

const fill = (testId: string) => getComputedStyle(screen.getByTestId(testId)).backgroundColor
/** jsdom spells an unpainted background either way depending on the declaration. */
const unpainted = (value: string) => value === 'transparent' || value === 'rgba(0, 0, 0, 0)'

describe('SidebarRow', () => {
  it('renders the label and calls back when clicked', async () => {
    const onClick = jest.fn()
    renderComponent(<SidebarRow label='general' onClick={onClick} data-testid='row' labelTestId='row-text' />)

    expect(screen.getByTestId('row-text').textContent).toEqual('general')

    await userEvent.click(screen.getByTestId('row'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fills a selected row with the library selected colour', () => {
    renderComponent(<SidebarRow label='general' selected data-testid='row' />)

    // `List item` State=Selected 3797:16113 - white at 10%, theme token `sidebarSelected`.
    expect(lightTheme.palette.colors.sidebarSelected).toEqual('#FFFFFF19')
    expect(unpainted(fill('row'))).toBe(false)
  })

  it('leaves an unselected row unfilled, so hover and selection stay distinct', () => {
    renderComponent(<SidebarRow label='general' data-testid='row' />)

    expect(unpainted(fill('row'))).toBe(true)
  })

  it('renders a badge when one is given', () => {
    renderComponent(
      <SidebarRow label='spooky' unread badge={<SidebarUnreadBadge data-testid='badge' />} data-testid='row' />
    )

    expect(screen.getByTestId('badge')).not.toBeNull()
  })

  it('shows a dot rather than a made-up number when there is no unread count', () => {
    renderComponent(<SidebarUnreadBadge data-testid='badge' />)

    // Quiet tracks unread as a boolean, so the library's numbered pill has
    // nothing to count and must not invent one.
    expect(screen.getByTestId('badge').textContent).toEqual('')
  })

  it('shows the count when one is given', () => {
    renderComponent(<SidebarUnreadBadge count={2} data-testid='badge' />)

    expect(screen.getByTestId('badge').textContent).toEqual('2')
  })
})
