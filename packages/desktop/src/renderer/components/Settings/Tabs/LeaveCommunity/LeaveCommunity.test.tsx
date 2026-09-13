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
    // The modal keeps its title and its warning.
    expect(result.getByText('Leave community?')).toBeTruthy()

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
            class="MuiGrid-root MuiGrid-container css-5wsvk4-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 LeaveCommunitytitleContainer css-s2k0j8-MuiGrid-root"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3 css-ts8dj1-MuiTypography-root"
              >
                Leave community?
              </h3>
            </div>
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
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall LeaveCommunitybutton css-1rawzna-MuiButtonBase-root-MuiButton-root"
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
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth LeaveCommunitysecondaryButton css-1u62ipv-MuiButtonBase-root-MuiButton-root"
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
