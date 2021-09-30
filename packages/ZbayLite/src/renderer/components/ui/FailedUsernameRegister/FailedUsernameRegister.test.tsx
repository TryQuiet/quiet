import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { FailedUsernameRegister } from './FailedUsernameRegister'

describe('FailedUsernameRegister', () => {
  it('renders component', () => {
    const result = renderComponent(
      <FailedUsernameRegister open handleClose={jest.fn()} openModalCreateUsername={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-6"
          role="presentation"
          style="position: fixed; z-index: 1300; right: 0px; bottom: 0px; top: 0px; left: 0px;"
        >
          <div
            aria-hidden="true"
            style="z-index: -1; position: fixed; right: 0px; bottom: 0px; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.5);"
          />
          <div
            data-test="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiGrid-root makeStyles-centered-13 makeStyles-window-14 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-8 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-7 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-10 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-149"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiIconButton-label"
                      >
                        <svg
                          aria-hidden="true"
                          class="MuiSvgIcon-root"
                          focusable="false"
                          role="presentation"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                          />
                        </svg>
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-fullPage-12 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-11 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-spacing-xs-3 MuiGrid-direction-xs-column"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-align-items-xs-center"
                  >
                    <img
                      class="makeStyles-icon-2"
                      src="test-file-stub"
                    />
                    <h3
                      class="MuiTypography-root makeStyles-message-3 MuiTypography-h3"
                    >
                      Oops!
                    </h3>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-info-4 MuiTypography-body2"
                      >
                        Username didn't get registered. You are still anonymous.
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-button-5"
                        tabindex="0"
                        type="button"
                      >
                        <span
                          class="MuiButton-label"
                        >
                          Create a username
                        </span>
                        <span
                          class="MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            data-test="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })
})
