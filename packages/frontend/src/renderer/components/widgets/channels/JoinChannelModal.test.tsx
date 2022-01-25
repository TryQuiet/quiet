import React from 'react'

import { JoinChannelModal } from './JoinChannelModal'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('JoinChannelModal', () => {
  it.skip('renders component', () => {
    const users = {}
    const result = renderComponent(
      <JoinChannelModal
        open
        handleClose={() => { }}
        joinChannel={() => { }}
        publicChannels={[]}
        users={users}
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
          class="makeStyles-root-14"
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
            class="MuiGrid-root makeStyles-centered-21 makeStyles-window-22 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-16 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-15 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-18 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-157"
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
              class="MuiGrid-root makeStyles-fullPage-20 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-19 MuiGrid-container MuiGrid-item"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root makeStyles-root-1"
                >
                  <form
                    class="makeStyles-fullContainer-2"
                  >
                    <div
                      class="MuiGrid-root makeStyles-fullContainer-2 MuiGrid-container MuiGrid-direction-xs-column"
                    >
                      <h3
                        class="MuiTypography-root makeStyles-title-5 MuiTypography-h3"
                      >
                        Search for Channels
                      </h3>
                      <div
                        aria-expanded="false"
                        class="MuiAutocomplete-root"
                        field="[object Object]"
                        form="[object Object]"
                        role="combobox"
                      >
                        <div
                          class="MuiFormControl-root MuiTextField-root makeStyles-input-3 MuiFormControl-marginNormal"
                        >
                          <div
                            class="MuiInputBase-root MuiOutlinedInput-root MuiAutocomplete-inputRoot MuiInputBase-formControl MuiInputBase-adornedEnd MuiOutlinedInput-adornedEnd"
                          >
                            <input
                              aria-autocomplete="list"
                              aria-invalid="false"
                              autocapitalize="none"
                              autocomplete="off"
                              class="MuiInputBase-input MuiOutlinedInput-input MuiAutocomplete-input MuiAutocomplete-inputFocused MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd"
                              id="mui-autocomplete-7409"
                              placeholder="Search"
                              spellcheck="false"
                              type="text"
                              value=""
                            />
                            <div
                              class="MuiAutocomplete-endAdornment"
                            >
                              <button
                                aria-label="Clear"
                                class="MuiButtonBase-root MuiIconButton-root MuiAutocomplete-clearIndicator MuiAutocomplete-clearIndicatorDirty"
                                tabindex="-1"
                                title="Clear"
                                type="button"
                              >
                                <span
                                  class="MuiIconButton-label"
                                >
                                  <svg
                                    aria-hidden="true"
                                    class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
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
                              <button
                                aria-label="Open"
                                class="MuiButtonBase-root MuiIconButton-root MuiAutocomplete-popupIndicator"
                                tabindex="-1"
                                title="Open"
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
                                      d="M7 10l5 5 5-5z"
                                    />
                                  </svg>
                                </span>
                                <span
                                  class="MuiTouchRipple-root"
                                />
                              </button>
                            </div>
                            <fieldset
                              aria-hidden="true"
                              class="PrivateNotchedOutline-root-239 MuiOutlinedInput-notchedOutline"
                              style="padding-left: 8px;"
                            >
                              <legend
                                class="PrivateNotchedOutline-legend-240"
                                style="width: 0.01px;"
                              >
                                <span>

                                </span>
                              </legend>
                            </fieldset>
                          </div>
                        </div>
                      </div>
                      <span
                        class="MuiTypography-root makeStyles-info-6 MuiTypography-caption"
                      >
                        If you have an invite link, open it in a browser
                      </span>
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
