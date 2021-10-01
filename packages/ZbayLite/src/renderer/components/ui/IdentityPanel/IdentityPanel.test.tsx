import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IdentityPanel } from './IdentityPanel'

import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

import { Provider } from 'react-redux'
import store from '../../../store'

describe('IdentityPanel', () => {
  it('renders component with username', () => {
    const identity: Identity = {
      id: '',
      zbayNickname: '',
      hiddenService: undefined,
      dmKeys: undefined,
      peerId: undefined,
      userCsr: undefined,
      userCertificate: ''
    }
    const result = renderComponent(
      <Provider store={store}>
        <IdentityPanel identity={identity} handleSettings={jest.fn()} />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        >
          <div
            class="makeStyles-root-1"
          >
            <span
              aria-disabled="false"
              class="MuiButtonBase-root MuiButton-root makeStyles-button-2 MuiButton-text"
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-3"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-4 MuiTypography-h4"
                />
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
                  focusable="false"
                  role="presentation"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  />
                </svg>
              </span>
              <span
                class="MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
        <div
          class="makeStyles-root-83"
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
            class="MuiGrid-root makeStyles-centered-90 makeStyles-window-91 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-85 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-84 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-87 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  />
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-fullPage-89 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-88 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root CreateUsernameModal-main-97 MuiGrid-container MuiGrid-direction-xs-column"
                >
                  <div
                    class="MuiGrid-root CreateUsernameModal-title-98 MuiGrid-item"
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
                    class="CreateUsernameModal-fullWidth-99"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container"
                    >
                      <div
                        class="MuiGrid-root CreateUsernameModal-field-101 MuiGrid-item MuiGrid-grid-xs-12"
                      >
                        <span
                          class="MuiTypography-root CreateUsernameModal-label-107 MuiTypography-caption"
                        >
                          Choose your favorite username:
                           
                        </span>
                        <div
                          class="MuiFormControl-root MuiTextField-root CreateUsernameModal-focus-94 CreateUsernameModal-margin-95 MuiFormControl-fullWidth"
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
                              class="PrivateNotchedOutline-root-264 MuiOutlinedInput-notchedOutline"
                              style="padding-left: 8px;"
                            >
                              <legend
                                class="PrivateNotchedOutline-legend-265"
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
                        class="MuiGrid-root CreateUsernameModal-infoDiv-110 MuiGrid-item MuiGrid-grid-xs-12"
                      >
                        <span
                          class="MuiTypography-root CreateUsernameModal-info-103 MuiTypography-caption"
                        >
                          Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.
                        </span>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-2"
                    >
                      <div
                        class="MuiGrid-root CreateUsernameModal-buttonDiv-102 MuiGrid-item MuiGrid-grid-xs-auto"
                      >
                        <button
                          class="MuiButtonBase-root MuiButton-root MuiButton-contained CreateUsernameModal-button-104 MuiButton-containedPrimary MuiButton-containedSizeSmall MuiButton-sizeSmall MuiButton-fullWidth"
                          margin="normal"
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
