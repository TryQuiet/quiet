import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import LeaveCommunityComponent from './LeaveCommunityComponent'

describe('LeaveCommunity', () => {
  it('replaces the buttons with the progress while leaving, and brings them back on failure', async () => {
    let reject!: (error: Error) => void
    const pending = new Promise<void>((_resolve, rej) => {
      reject = rej
    })
    const leave = jest.fn().mockReturnValueOnce(pending).mockResolvedValue(undefined)
    const result = renderComponent(
      <LeaveCommunityComponent communityName='Rockets' leaveCommunity={leave} open={true} handleClose={jest.fn()} />
    )

    fireEvent.click(result.getByTestId('leave-community-button'))
    expect(leave).toHaveBeenCalledTimes(1)

    // In progress: no button to grey out, the progress bar and its status instead.
    expect(result.queryByTestId('leave-community-button')).toBeNull()
    expect(result.queryByText('Go back')).toBeNull()
    expect(result.getByTestId('leave-community-progress')).toBeTruthy()
    expect(result.getByRole('progressbar')).toBeTruthy()
    expect(result.getByTestId('actionProgressStatus').textContent).toBe('Leaving community…')
    // The panel keeps its warning; the drawer bar, not the panel, carries the title.
    expect(result.getByText(/You will no longer have access/)).toBeTruthy()

    await act(async () => {
      reject(new Error('backend failed'))
    })

    // Failed: back to the button, with the error.
    expect(result.getByRole('alert').textContent).toContain('Please try again')
    expect(result.queryByTestId('leave-community-progress')).toBeNull()
    const button = result.getByTestId('leave-community-button') as HTMLButtonElement
    expect(button.disabled).toBe(false)
    expect(button.textContent).toContain('Leave community')

    fireEvent.click(button)
    await waitFor(() => expect(result.queryByTestId('leave-community-progress')).toBeNull())
    expect(leave).toHaveBeenCalledTimes(2)
    expect(result.queryByRole('alert')).toBeNull()
  })

  it('leaves the title to the drawer bar rather than repeating it in the panel', () => {
    const result = renderComponent(
      <LeaveCommunityComponent communityName='Rockets' leaveCommunity={jest.fn()} open={true} handleClose={jest.fn()} />
    )

    // The drawer bar above this panel already says "Leave community", so the panel draws no
    // heading of its own - neither the old "Leave community?" nor any other.
    expect(result.queryByText('Leave community?')).toBeNull()
    expect(result.queryAllByRole('heading')).toHaveLength(0)

    // The warning and both actions stay.
    expect(result.getByText(/You will no longer have access to this community/)).toBeTruthy()
    expect(result.getByText('Go back')).toBeTruthy()
    expect(result.getByTestId('leave-community-button')).toBeTruthy()
  })

  it('leaves once however many times the button is clicked', async () => {
    let resolve!: () => void
    const pending = new Promise<void>(res => {
      resolve = res
    })
    const leave = jest.fn().mockReturnValue(pending)
    const result = renderComponent(
      <LeaveCommunityComponent communityName='Rockets' leaveCommunity={leave} open={true} handleClose={jest.fn()} />
    )

    const button = result.getByTestId('leave-community-button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(leave).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve()
    })
  })

  it('renders component', () => {
    const result = renderComponent(
      <LeaveCommunityComponent
        communityName={'Rockets'}
        leaveCommunity={jest.fn()}
        open={true}
        handleClose={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container css-1h5wsmg-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitydescContainer css-s2k0j8-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body2 MuiTypography-alignCenter css-7ax5m0-MuiTypography-root"
              >
                You will no longer have access to this community. This can't be undone.
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitysecondaryButtonContainer css-s2k0j8-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall LeaveCommunitybutton css-xxpouk-MuiButtonBase-root-MuiButton-root"
                tabindex="0"
                type="button"
              >
                Go back
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-auto LeaveCommunitybuttonContainer css-1wrgmsj-MuiGrid-root"
            >
              <button
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth LeaveCommunitysecondaryButton css-10flyoh-MuiButtonBase-root-MuiButton-root"
                data-testid="leave-community-button"
                tabindex="0"
                type="button"
              >
                Leave community
                <span
                  class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                />
              </button>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
