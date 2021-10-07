/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { CreateUsernameModal } from './CreateUsernameModal'

describe('CreateUsernameModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <CreateUsernameModal handleClose={jest.fn()} initialValue={'test'} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-19"
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
            class="MuiGrid-root makeStyles-centered-26 makeStyles-window-27 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-21 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-20 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-23 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  />
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-fullPage-25 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-24 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root makeStyles-main-5 MuiGrid-container MuiGrid-direction-xs-column"
                >
                  <div
                    class="MuiGrid-root makeStyles-title-6 MuiGrid-item"
                  >
                    <h3
                      class="MuiTypography-root MuiTypography-h3"
                    >
                      Register a username
                    </h3>
                    <input
                      name="topicBox"
                      placeholder="Enter topic here..."
                      type="text"
                      value=""
                    />
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        create community
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        trigger selector
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        join community
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        launch community
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        launch registrar
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-text"
                      tabindex="0"
                      type="button"
                    >
                      <span
                        class="MuiButton-label"
                      >
                        register username
                      </span>
                      <span
                        class="MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                  <form
                    class="makeStyles-fullWidth-7"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container"
                    >
                      <div
                        class="MuiGrid-root makeStyles-field-9 MuiGrid-item MuiGrid-grid-xs-12"
                      >
                        <span
                          class="MuiTypography-root makeStyles-label-15 MuiTypography-caption"
                        >
                          Choose your favorite username:
                           
                        </span>
                        <div
                          class="MuiFormControl-root MuiTextField-root makeStyles-focus-2 makeStyles-margin-3 MuiFormControl-fullWidth"
                        >
                          <div
                            class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-fullWidth MuiInputBase-formControl"
                          >
                            <input
                              aria-invalid="false"
                              class="MuiInputBase-input MuiOutlinedInput-input"
                              name="nickname"
                              placeholder="Enter a username"
                              type="text"
                              value=""
                            />
                            <fieldset
                              aria-hidden="true"
                              class="PrivateNotchedOutline-root-233 MuiOutlinedInput-notchedOutline"
                              style="padding-left: 8px;"
                            >
                              <legend
                                class="PrivateNotchedOutline-legend-234"
                                style="width: 0.01px;"
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
                        class="MuiGrid-root makeStyles-infoDiv-18 MuiGrid-item MuiGrid-grid-xs-12"
                      >
                        <span
                          class="MuiTypography-root makeStyles-info-11 MuiTypography-caption"
                        >
                          Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.
                        </span>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2"
                    >
                      <div
                        class="MuiGrid-root makeStyles-buttonDiv-10 MuiGrid-item MuiGrid-grid-xs-auto"
                      >
                        <button
                          class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-12 MuiButton-containedPrimary MuiButton-containedSizeSmall MuiButton-sizeSmall MuiButton-fullWidth"
                          tabindex="0"
                          type="submit"
                        >
                          <span
                            class="MuiButton-label"
                          >
                            Continue
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                      </div>
                    </div>
                  </form>
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
