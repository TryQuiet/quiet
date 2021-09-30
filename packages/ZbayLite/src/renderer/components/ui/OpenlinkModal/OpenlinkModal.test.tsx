import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { OpenlinkModal } from './OpenlinkModal'

describe('OpenlinkModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <OpenlinkModal
        url='https://www.zbay.app/'
        open
        isImage
        handleClose={jest.fn()}
        handleConfirm={jest.fn()}
        addToWhitelist={jest.fn()}
        setWhitelistAll={jest.fn()}
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
          class="makeStyles-root-10"
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
            class="MuiGrid-root makeStyles-centered-17 makeStyles-window-18 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-12 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-11 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-14 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-153"
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
              class="MuiGrid-root makeStyles-fullPage-16 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-15 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  style="overflow: visible; height: 0px; width: 0px;"
                >
                  <div
                    class="rc-scrollbars-container"
                    style="position: relative; overflow: hidden; width: 0px; height: 0px;"
                  >
                    <div
                      class="rc-scrollbars-view"
                      style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
                    >
                      <div
                        class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-align-items-xs-center"
                        >
                          <img
                            class="makeStyles-icon-2"
                            src="test-file-stub"
                          />
                          <h2
                            class="MuiTypography-root makeStyles-title-3 MuiTypography-h2"
                          >
                            Watch out!
                          </h2>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root MuiTypography-body2"
                            >
                              Opening link posted in Zbay reveals data about you to your goverment, your Internet provider, the site you are visiting and, potentially, to whoever posted the link. Only open links from people you trust. If you are using Zbay to protect your anonymity, never open links.
                            </p>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root makeStyles-checkboxes-7 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                        >
                           
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <span
                                aria-disabled="false"
                                class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-181 MuiCheckbox-root MuiCheckbox-colorPrimary MuiIconButton-colorPrimary"
                              >
                                <span
                                  class="MuiIconButton-label"
                                >
                                  <input
                                    class="PrivateSwitchBase-input-184"
                                    data-indeterminate="false"
                                    type="checkbox"
                                    value=""
                                  />
                                  <svg
                                    aria-hidden="true"
                                    class="MuiSvgIcon-root"
                                    focusable="false"
                                    role="presentation"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                                    />
                                  </svg>
                                </span>
                                <span
                                  class="MuiTouchRipple-root"
                                />
                              </span>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-checkboxLabel-6 MuiGrid-item MuiGrid-grid-xs-true"
                            >
                              Automatically load images from 
                              <span
                                class="makeStyles-bold-5"
                              >
                                www.zbay.app
                              </span>
                              - I trust them with my data and I'm not using Zbay for anonymity protection. 
                            </div>
                          </div>
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <span
                                aria-disabled="false"
                                class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-181 MuiCheckbox-root MuiCheckbox-colorPrimary MuiIconButton-colorPrimary"
                              >
                                <span
                                  class="MuiIconButton-label"
                                >
                                  <input
                                    class="PrivateSwitchBase-input-184"
                                    data-indeterminate="false"
                                    type="checkbox"
                                    value=""
                                  />
                                  <svg
                                    aria-hidden="true"
                                    class="MuiSvgIcon-root"
                                    focusable="false"
                                    role="presentation"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                                    />
                                  </svg>
                                </span>
                                <span
                                  class="MuiTouchRipple-root"
                                />
                              </span>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-checkboxLabel-6 MuiGrid-item MuiGrid-grid-xs-true"
                            >
                              Don't warn me about 
                              <span
                                class="makeStyles-bold-5"
                              >
                                www.zbay.app
                              </span>
                               
                              again, but don't auto-load images.
                            </div>
                          </div>
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <span
                                aria-disabled="false"
                                class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-181 MuiCheckbox-root MuiCheckbox-colorPrimary MuiIconButton-colorPrimary"
                              >
                                <span
                                  class="MuiIconButton-label"
                                >
                                  <input
                                    class="PrivateSwitchBase-input-184"
                                    data-indeterminate="false"
                                    type="checkbox"
                                    value=""
                                  />
                                  <svg
                                    aria-hidden="true"
                                    class="MuiSvgIcon-root"
                                    focusable="false"
                                    role="presentation"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                                    />
                                  </svg>
                                </span>
                                <span
                                  class="MuiTouchRipple-root"
                                />
                              </span>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-checkboxLabel-6 MuiGrid-item MuiGrid-grid-xs-true"
                            >
                              Never warn me about outbound links on Zbay.
                            </div>
                          </div>
                          <div
                            class="MuiGrid-root makeStyles-buttons-9 MuiGrid-container MuiGrid-spacing-xs-2 MuiGrid-item MuiGrid-align-items-xs-center"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <button
                                class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-buttonBack-8 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge"
                                tabindex="0"
                                type="button"
                              >
                                <span
                                  class="MuiButton-label"
                                >
                                  Back to safety
                                </span>
                                <span
                                  class="MuiTouchRipple-root"
                                />
                              </button>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                            >
                              <a
                                href=""
                                style="color: rgb(103, 191, 211); text-decoration: none; word-break: break-all;"
                              >
                                Load image from site www.zbay.app
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="rc-scrollbars-track rc-scrollbars-track-h"
                      style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; left: 2px; height: 6px; display: none;"
                    >
                      <div
                        class="rc-scrollbars-thumb rc-scrollbars-thumb-h"
                        style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                      />
                    </div>
                    <div
                      class="rc-scrollbars-track rc-scrollbars-track-v"
                      style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; top: 2px; width: 6px; display: none;"
                    >
                      <div
                        class="rc-scrollbars-thumb rc-scrollbars-thumb-v"
                        style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="resize-triggers"
                >
                  <div
                    class="expand-trigger"
                  >
                    <div
                      style="width: 1px; height: 1px;"
                    />
                  </div>
                  <div
                    class="contract-trigger"
                  />
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
