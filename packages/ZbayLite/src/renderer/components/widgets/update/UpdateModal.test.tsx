/* eslint import/first: 0 */
import React from 'react'

import { UpdateModal } from './UpdateModal'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('UpdateModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <UpdateModal open handleClose={jest.fn()} handleUpdate={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-7"
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
            class="MuiGrid-root makeStyles-centered-14 makeStyles-window-15 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-9 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-8 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-11 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-150"
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
              class="MuiGrid-root makeStyles-fullPage-13 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-12 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center"
                >
                  <div
                    class="MuiGrid-root makeStyles-info-2 MuiGrid-container MuiGrid-justify-xs-center"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
                  >
                    <div
                      class="MuiGrid-root makeStyles-title-5 MuiGrid-item"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3"
                      >
                        Softare update
                      </h3>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
                  >
                    <div
                      class="MuiGrid-root makeStyles-subTitle-6 MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body2"
                      >
                        An update is available for Zbay.
                      </p>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-8 MuiGrid-justify-xs-center"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-4"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-3 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge MuiButton-fullWidth"
                        tabindex="0"
                        type="submit"
                      >
                        <span
                          class="MuiButton-label"
                        >
                          Update now
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
