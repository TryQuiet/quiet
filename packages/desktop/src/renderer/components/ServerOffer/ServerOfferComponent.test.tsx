import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { ServerOfferComponent } from './ServerOfferComponent'
import { renderComponent } from '../../testUtils'

describe('ServerOfferComponent', () => {
  it('renders checkbox and divider when showDontShowAgain is true', async () => {
    const handleClose = jest.fn()
    const result = renderComponent(
      <ServerOfferComponent open={true} handleClose={handleClose} showDontShowAgain={true} />
    )

    // Inline snapshot of the rendered component
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="MuiModal-root css-1l68gny-MuiModal-root"
          role="presentation"
        >
          <div
            aria-hidden="true"
            class="MuiBackdrop-root css-i9fmh8-MuiBackdrop-root-MuiModal-backdrop"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
          />
          <div
            data-testid="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Modalcentered css-6gh8l0-MuiGrid-root"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader Modalnone css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="ServerOfferModalActions"
                  />
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage ModalwithoutHeader css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column ServerOfferComponent-contentWrap css-1tvlnd7-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item ServerOfferComponent-iconContainer css-13i4rnv-MuiGrid-root"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium ServerOfferComponent-icon css-i4bv87-MuiSvgIcon-root"
                      focusable="false"
                      viewBox="0 0 49 51"
                    >
                      <path
                        d="M12.5 8C11.3889 8 10.4444 8.38889 9.66667 9.16667C8.88889 9.94444 8.5 10.8889 8.5 12C8.5 13.1111 8.88889 14.0556 9.66667 14.8333C10.4444 15.6111 11.3889 16 12.5 16C13.6111 16 14.5556 15.6111 15.3333 14.8333C16.1111 14.0556 16.5 13.1111 16.5 12C16.5 10.8889 16.1111 9.94444 15.3333 9.16667C14.5556 8.38889 13.6111 8 12.5 8ZM12.5 34.6667C11.3889 34.6667 10.4444 35.0556 9.66667 35.8333C8.88889 36.6111 8.5 37.5556 8.5 38.6667C8.5 39.7778 8.88889 40.7222 9.66667 41.5C10.4444 42.2778 11.3889 42.6667 12.5 42.6667C13.6111 42.6667 14.5556 42.2778 15.3333 41.5C16.1111 40.7222 16.5 39.7778 16.5 38.6667C16.5 37.5556 16.1111 36.6111 15.3333 35.8333C14.5556 35.0556 13.6111 34.6667 12.5 34.6667ZM3.16667 0H45.8333C46.5889 0 47.2222 0.255556 47.7333 0.766667C48.2444 1.27778 48.5 1.91111 48.5 2.66667V21.3333C48.5 22.0889 48.2444 22.7222 47.7333 23.2333C47.2222 23.7444 46.5889 24 45.8333 24H3.16667C2.41111 24 1.77778 23.7444 1.26667 23.2333C0.755556 22.7222 0.5 22.0889 0.5 21.3333V2.66667C0.5 1.91111 0.755556 1.27778 1.26667 0.766667C1.77778 0.255556 2.41111 0 3.16667 0ZM5.83333 5.33333V18.6667H43.1667V5.33333H5.83333ZM3.16667 26.6667H45.8333C46.5889 26.6667 47.2222 26.9222 47.7333 27.4333C48.2444 27.9444 48.5 28.5778 48.5 29.3333V48C48.5 48.7556 48.2444 49.3889 47.7333 49.9C47.2222 50.4111 46.5889 50.6667 45.8333 50.6667H3.16667C2.41111 50.6667 1.77778 50.4111 1.26667 49.9C0.755556 49.3889 0.5 48.7556 0.5 48V29.3333C0.5 28.5778 0.755556 27.9444 1.26667 27.4333C1.77778 26.9222 2.41111 26.6667 3.16667 26.6667ZM5.83333 32V45.3333H43.1667V32H5.83333Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column ServerOfferComponent-text css-1tvlnd7-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                      >
                        Want a server?
                      </h3>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item ServerOfferComponent-pill css-13i4rnv-MuiGrid-root"
                    >
                      <div
                        class="MuiChip-root MuiChip-filled MuiChip-sizeMedium MuiChip-colorDefault MuiChip-filledDefault css-1b8vt3y-MuiChip-root"
                      >
                        <span
                          class="MuiChip-label MuiChip-labelMedium css-6od3lo-MuiChip-label"
                        >
                          It’s free!
                        </span>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body1 ServerOfferComponent-info css-ghvhpl-MuiTypography-root"
                      >
                        Messages are still end-to-end encrypted, joining will be faster, and Quiet will work much better on iPhones.
                      </p>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column ServerOfferComponent-actions css-1tvlnd7-MuiGrid-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeLarge MuiButton-containedSizeLarge ServerOfferComponent-useServerButton css-10kf9y4-MuiButtonBase-root-MuiButton-root"
                        data-testid="ServerOffer-UseQuietServer"
                        tabindex="0"
                        type="button"
                      >
                        Use Quiet’s server
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeSmall MuiButton-textSizeSmall ServerOfferComponent-notNowButton css-4e5mdh-MuiButtonBase-root-MuiButton-root"
                        data-testid="ServerOffer-NotNow"
                        tabindex="0"
                        type="button"
                      >
                        Not now
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item ServerOfferComponent-dividerWrap css-13i4rnv-MuiGrid-root"
                  >
                    <hr
                      class="MuiDivider-root MuiDivider-fullWidth css-10g3z0f-MuiDivider-root"
                    />
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                  >
                    <label
                      class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd ServerOfferComponent-mutedAction css-jzcd7z-MuiFormControlLabel-root"
                    >
                      <span
                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-p0kowz-MuiButtonBase-root-MuiCheckbox-root"
                      >
                        <input
                          class="PrivateSwitchBase-input css-1m9pwf3"
                          data-indeterminate="false"
                          type="checkbox"
                        />
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                          data-testid="CheckBoxOutlineBlankIcon"
                          focusable="false"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                          />
                        </svg>
                        <span
                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                        />
                      </span>
                      <span
                        class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                      >
                        Don’t show this again
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            data-testid="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)

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
