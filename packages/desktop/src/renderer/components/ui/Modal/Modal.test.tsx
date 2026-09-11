import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { renderComponent } from '../../../testUtils/renderComponent'
import { Modal } from './Modal'

describe('Modal close control (issue #1592)', () => {
  it('has an accessible name and can be reached and activated by keyboard', async () => {
    const handleClose = jest.fn()

    renderComponent(
      <Modal open handleClose={handleClose} title='Test modal'>
        <div>content</div>
      </Modal>
    )

    // Accessible name: assistive tech must be able to identify this control as
    // "Close", not just "button" (the bug reported in #1592).
    const closeButton = screen.getByRole('button', { name: /close/i })

    // Keyboard reachable: it must be a real, focusable control.
    closeButton.focus()
    expect(closeButton).toHaveFocus()

    // Keyboard activatable: pressing Enter while focused must trigger the
    // close handler. (A naive tabindex-only fix would make the element
    // focusable but still inert on Enter/Space if it weren't a real button.)
    await userEvent.keyboard('{Enter}')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
