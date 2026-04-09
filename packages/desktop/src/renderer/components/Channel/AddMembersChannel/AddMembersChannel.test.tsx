import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import AddMembersChannelComponent from './AddMembersChannelComponent'

describe('AddMembersChannel', () => {
  it('renders component', () => {
    const result = renderComponent(
      <AddMembersChannelComponent
        channelName='general'
        channelId='foobar'
        allUsers={{}}
        possibleMembers={{}}
        addMembersToChannel={jest.fn()}
        open={true}
        handleOpen={jest.fn()}
        handleClose={jest.fn()}
      />
    )
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
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Modalwindow css-6gh8l0-MuiGrid-root"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader css-lx31tv-MuiGrid-root"
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
                    data-testid="ModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-1hpikoh-MuiButtonBase-root-MuiIconButton-root"
                      data-testid="ModalClose"
                      tabindex="0"
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                        data-testid="ClearIcon"
                        focusable="false"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalnotFullPage css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 600px;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container css-1aconu4-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 AddMembersChanneldescContainer css-s2k0j8-MuiGrid-root"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body1 MuiTypography-alignCenter css-jxzupi-MuiTypography-root"
                    >
                      Add members to 
                      <span
                        style="font-weight: 500;"
                      >
                        #
                        general
                      </span>
                      :
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item css-mxpema-MuiGrid-root"
                  >
                    <div
                      class="MuiAutocomplete-root MuiAutocomplete-hasPopupIcon css-gcwvw8-MuiAutocomplete-root"
                      data-testid="general-add-members-autocomplete"
                    >
                      <div
                        class="MuiFormControl-root MuiFormControl-fullWidth MuiTextField-root css-wb57ya-MuiFormControl-root-MuiTextField-root"
                      >
                        <label
                          class="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-outlined css-rb5gc9-MuiFormLabel-root-MuiInputLabel-root"
                          data-shrink="false"
                          for=":r0:"
                          id=":r0:-label"
                        >
                          Add members
                        </label>
                        <div
                          class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiAutocomplete-inputRoot css-1jgdtkb-MuiInputBase-root-MuiOutlinedInput-root"
                        >
                          <input
                            aria-autocomplete="list"
                            aria-expanded="false"
                            aria-invalid="false"
                            autocapitalize="none"
                            autocomplete="off"
                            class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1h9uykw-MuiInputBase-input-MuiOutlinedInput-input"
                            id=":r0:"
                            role="combobox"
                            spellcheck="false"
                            type="text"
                            value=""
                          />
                          <div
                            class="MuiAutocomplete-endAdornment css-1q60rmi-MuiAutocomplete-endAdornment"
                          >
                            <button
                              aria-label="Open"
                              class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-popupIndicator css-1ciwbrp-MuiButtonBase-root-MuiIconButton-root-MuiAutocomplete-popupIndicator"
                              tabindex="-1"
                              title="Open"
                              type="button"
                            >
                              <svg
                                aria-hidden="true"
                                class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                                data-testid="ArrowDropDownIcon"
                                focusable="false"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  d="M7 10l5 5 5-5z"
                                />
                              </svg>
                              <span
                                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <fieldset
                            aria-hidden="true"
                            class="MuiOutlinedInput-notchedOutline css-9425fu-MuiOutlinedInput-notchedOutline"
                          >
                            <legend
                              class="css-yjsfm1"
                            >
                              <span>
                                Add members
                              </span>
                            </legend>
                          </fieldset>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-auto AddMembersChannelbuttonContainer css-1wrgmsj-MuiGrid-root"
                  >
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth AddMembersChannelbutton css-sdx6r0-MuiButtonBase-root-MuiButton-root"
                      data-testid="general-add-members-button"
                      tabindex="0"
                      type="button"
                    >
                      Add 
                      0
                       members
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </button>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-12 AddMembersChannelsecondaryButtonContainer css-s2k0j8-MuiGrid-root"
                  >
                    <button
                      class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeSmall MuiButton-containedSizeSmall MuiButton-fullWidth AddMembersChannelsecondaryButton css-sdx6r0-MuiButtonBase-root-MuiButton-root"
                      data-testid="general-add-members-leave-button"
                      tabindex="0"
                      type="button"
                    >
                      Never mind
                      <span
                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                      />
                    </button>
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
  })
})
