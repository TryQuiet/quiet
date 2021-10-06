import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ErrorModal } from './ErrorModal'

describe('ErrorModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ErrorModal
        open
        message='Test error message'
        traceback='Error: Test error message, error traceback'
        handleExit={jest.fn()}
        restartApp={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-9"
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
            class="MuiGrid-root makeStyles-centered-16 makeStyles-window-17 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-11 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-10 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  >
                    Error
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-13 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-152"
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
              class="MuiGrid-root makeStyles-fullPage-15 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-14 MuiGrid-container MuiGrid-item"
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
                      class="MuiTypography-root makeStyles-message-4 MuiTypography-h3"
                    >
                      Test error message
                    </h3>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2 MuiGrid-item MuiGrid-direction-xs-column"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-info-5 MuiTypography-body2"
                      >
                        You can send us this error traceback to help us improve. Before sending make sure it doesn't contain any private data.
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <div
                        class="MuiFormControl-root MuiTextField-root MuiFormControl-fullWidth"
                      >
                        <div
                          class="MuiInputBase-root MuiOutlinedInput-root makeStyles-textfield-6 Mui-disabled Mui-disabled makeStyles-cssDisabled-7 MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-multiline MuiOutlinedInput-multiline makeStyles-stackTrace-3"
                        >
                          <textarea
                            aria-invalid="false"
                            class="MuiInputBase-input MuiOutlinedInput-input Mui-disabled Mui-disabled makeStyles-cssDisabled-7 MuiInputBase-inputMultiline MuiOutlinedInput-inputMultiline"
                            disabled=""
                            id="traceback"
                            rows="10"
                          >
                            Error: Test error message, error traceback
                          </textarea>
                          <fieldset
                            aria-hidden="true"
                            class="PrivateNotchedOutline-root-214 MuiOutlinedInput-notchedOutline"
                            style="padding-left: 8px;"
                          >
                            <legend
                              class="PrivateNotchedOutline-legend-215"
                              style="width: 0px;"
                            >
                              <span>
                                ​
                              </span>
                            </legend>
                          </fieldset>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-button-8"
                        tabindex="0"
                        type="button"
                      >
                        <span
                          class="MuiButton-label"
                        >
                          Send & restart
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
