import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import LeaveCommunityComponent from './LeaveCommunityComponent'

describe('LeaveCommunity', () => {
  it('disables repeated clicks while leaving and lets the user retry a failure', async () => {
    let reject!: (error: Error) => void
    const pending = new Promise<void>((_resolve, rej) => {
      reject = rej
    })
    const leave = jest.fn().mockReturnValueOnce(pending).mockResolvedValue(undefined)
    const result = renderComponent(
      <LeaveCommunityComponent communityName='Rockets' leaveCommunity={leave} open={true} handleClose={jest.fn()} />
    )
    const button = result.getByTestId('leave-community-button') as HTMLButtonElement
    fireEvent.click(button)
    fireEvent.click(button)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(button.disabled).toBe(true)
    expect(button.textContent).toBe('Leaving community…')
    await act(async () => {
      reject(new Error('backend failed'))
    })
    expect(result.getByRole('alert').textContent).toContain('Please try again')
    expect(button.disabled).toBe(false)
    fireEvent.click(button)
    await waitFor(() => expect(button.disabled).toBe(false))
    expect(leave).toHaveBeenCalledTimes(2)
    expect(result.queryByRole('alert')).toBeNull()
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
            class="MuiGrid-root MuiGrid-container css-1asgg07-MuiGrid-root"
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
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall LeaveCommunitybutton css-127th3r-MuiButtonBase-root-MuiButton-root"
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
                class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth LeaveCommunitysecondaryButton css-sdx6r0-MuiButtonBase-root-MuiButton-root"
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
