import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { ServerOfferComponent } from './ServerOfferComponent'
import { renderComponent } from '../../testUtils'

describe('ServerOfferComponent', () => {
  it('renders checkbox and divider when showDontShowAgain is true', async () => {
    const handleClose = jest.fn()
    renderComponent(<ServerOfferComponent open={true} handleClose={handleClose} showDontShowAgain={true} />)

    // Checkbox should be present
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    // Divider should be present
    expect(screen.getByRole('separator')).toBeVisible()
  })

  it('renders modal and handles actions (default, no checkbox)', async () => {
    const handleClose = jest.fn()
    renderComponent(<ServerOfferComponent open={true} handleClose={handleClose} />)

    // Modal content
    expect(screen.getByText('Want a server?')).toBeVisible()
    expect(screen.getByText('It’s free!')).toBeVisible()
    expect(screen.getByText(/Messages are still end-to-end encrypted/)).toBeVisible()

    // Use Quiet’s server button
    const useServerBtn = screen.getByTestId('ServerOffer-UseQuietServer')
    expect(useServerBtn).toBeVisible()
    await userEvent.click(useServerBtn)
    expect(handleClose).toHaveBeenCalledWith(true)

    // Not now button
    const notNowBtn = screen.getByTestId('ServerOffer-NotNow')
    expect(notNowBtn).toBeVisible()
    await userEvent.click(notNowBtn)
    expect(handleClose).toHaveBeenCalledWith(false)

    // Checkbox should not be present
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})
