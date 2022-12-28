/* eslint import/first: 0 */
import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import { useModal } from '../../../../containers/hooks'
import React from 'react'
import { Provider } from 'react-redux'
import store from '../../../../store'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { SettingsModal } from './SettingsModal'

describe('SettingsModal', () => {
  const leaveCommunityModal: ReturnType<typeof useModal> = {
    handleClose: jest.fn(),
    handleOpen: jest.fn(),
    open: Boolean
  }

  it('renders component for non-owner', () => {
    const result = renderComponent(
      <Provider store={store}>
        <SettingsModal title='settings' isOwner={false} open handleClose={jest.fn()} leaveCommunityModal={leaveCommunityModal} />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="Modalroot MuiModal-root css-1hk9oxe-MuiModal-root"
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader ModalheaderBorder css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle Modalbold css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  >
                    settings
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="settingsModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-c8hoqc-MuiButtonBase-root-MuiIconButton-root"
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 100%;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container css-mjeemy-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item css-1hxrcsw-MuiGrid-root"
                    style="margin-left: 0px;"
                  >
                    <header
                      class="MuiPaper-root MuiPaper-elevation MuiPaper-elevation4 MuiAppBar-root MuiAppBar-colorPrimary MuiAppBar-positionStatic css-1ockhlj-MuiPaper-root-MuiAppBar-root-xxxxx"
                    >
                      <div
                        class="MuiTabs-root MuiTabs-vertical css-11gjkeb-MuiTabs-root"
                      >
                        <div
                          class="MuiTabs-scroller MuiTabs-fixed css-jpln7h-MuiTabs-scroller"
                          style="overflow: hidden; margin-right: 0px;"
                        >
                          <div
                            aria-orientation="vertical"
                            class="MuiTabs-flexContainer MuiTabs-flexContainerVertical css-lfwcke-MuiTabs-flexContainer"
                            role="tablist"
                          >
                            <button
                              aria-selected="true"
                              class="MuiButtonBase-root MuiTab-root TabtabRoot MuiTab-textColorInherit Mui-selected Tabselected css-1iect55-MuiButtonBase-root-MuiTab-root"
                              data-testid="notifications-settings-tab"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              Notifications
                              <span
                                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <span
                            class="MuiTabs-indicator SettingsModalindicator css-1dlvkit-MuiTabs-indicator"
                            style="top: 0px; height: 0px;"
                          />
                        </div>
                      </div>
                    </header>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
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
                            class="MuiGrid-root MuiGrid-item css-hkxyay-MuiGrid-root"
                            style="padding-right: 0px;"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-9tpmqz-MuiGrid-root"
                            >
                              <div
                                class="MuiGrid-root MuiGrid-container MuiGrid-item NotificationstitleDiv css-89gxc5-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item Notificationstitle css-13i4rnv-MuiGrid-root"
                                >
                                  <h3
                                    class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                                  >
                                    Notifications
                                  </h3>
                                </div>
                              </div>
                              <div
                                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                              >
                                <h5
                                  class="MuiTypography-root MuiTypography-h5 Notificationssubtitle css-11l3dv4-MuiTypography-root"
                                >
                                  Notify me about...
                                </h5>
                              </div>
                              <div
                                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column NotificationsradioDiv css-80wlp8-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item Notificationsspacing css-13i4rnv-MuiGrid-root"
                                >
                                  <label
                                    class="MuiFormControlLabel-root NotificationsradioIcon MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                  >
                                    <span
                                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary Mui-checked MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                    >
                                      <input
                                        checked=""
                                        class="PrivateSwitchBase-input css-1m9pwf3"
                                        data-indeterminate="false"
                                        type="checkbox"
                                      />
                                      <img
                                        src="test-file-stub"
                                      />
                                      <span
                                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                      />
                                    </span>
                                    <span
                                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                    >
                                      <div
                                        class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Notificationsoffset css-1vpwcmr-MuiGrid-root"
                                      >
                                        <div
                                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                        >
                                          <span
                                            class="Notificationsbold"
                                          >
                                            Every new message
                                          </span>
                                        </div>
                                        <div
                                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                        >
                                          <span>
                                            You’ll be notified for every new message
                                          </span>
                                        </div>
                                      </div>
                                    </span>
                                  </label>
                                   
                                </div>
                                <div
                                  class="MuiGrid-root MuiGrid-item Notificationsspacing css-13i4rnv-MuiGrid-root"
                                >
                                  <label
                                    class="MuiFormControlLabel-root NotificationsradioIcon MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                  >
                                    <span
                                      class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                    >
                                      <input
                                        class="PrivateSwitchBase-input css-1m9pwf3"
                                        data-indeterminate="false"
                                        type="checkbox"
                                      />
                                      <img
                                        src="test-file-stub"
                                      />
                                      <span
                                        class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                      />
                                    </span>
                                    <span
                                      class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                    >
                                      <div
                                        class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column Notificationsoffset css-1vpwcmr-MuiGrid-root"
                                      >
                                        <div
                                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                        >
                                          <span
                                            class="Notificationsbold"
                                          >
                                            Nothing
                                          </span>
                                        </div>
                                        <div
                                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                        >
                                          <span>
                                            You won’t receive notificaitons from Quiet.
                                          </span>
                                        </div>
                                      </div>
                                    </span>
                                  </label>
                                </div>
                                <div
                                  class="MuiGrid-root MuiGrid-item NotificationssubtitleSoundDiv css-13i4rnv-MuiGrid-root"
                                >
                                  <h5
                                    class="MuiTypography-root MuiTypography-h5 Notificationssubtitle css-11l3dv4-MuiTypography-root"
                                  >
                                    Sounds
                                  </h5>
                                </div>
                                <div
                                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column NotificationsradioSoundDiv css-80wlp8-MuiGrid-root"
                                >
                                  <div
                                    class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                  >
                                    <label
                                      class="MuiFormControlLabel-root MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                    >
                                      <span
                                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorDefault PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorDefault Mui-checked MuiCheckbox-root MuiCheckbox-colorDefault css-dk24d0-MuiButtonBase-root-MuiCheckbox-root"
                                      >
                                        <input
                                          checked=""
                                          class="PrivateSwitchBase-input css-1m9pwf3"
                                          data-indeterminate="false"
                                          type="checkbox"
                                        />
                                        <svg
                                          aria-hidden="true"
                                          class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                                          data-testid="CheckBoxIcon"
                                          focusable="false"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                                          />
                                        </svg>
                                        <span
                                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                        />
                                      </span>
                                      <p
                                        class="MuiTypography-root MuiTypography-body2 Notificationslabel css-16d47hw-MuiTypography-root"
                                      >
                                        Play a sound when receiving a notification
                                      </p>
                                    </label>
                                  </div>
                                  <div
                                    class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                                  >
                                    <label
                                      class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                    >
                                      <span
                                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                      >
                                        <input
                                          class="PrivateSwitchBase-input css-1m9pwf3"
                                          data-indeterminate="false"
                                          type="checkbox"
                                        />
                                        <img
                                          src="test-file-stub"
                                        />
                                        <span
                                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                        />
                                      </span>
                                      <span
                                        class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                      >
                                        Librarian Shhh
                                      </span>
                                    </label>
                                  </div>
                                  <div
                                    class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                                  >
                                    <label
                                      class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                    >
                                      <span
                                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary Mui-checked MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                      >
                                        <input
                                          checked=""
                                          class="PrivateSwitchBase-input css-1m9pwf3"
                                          data-indeterminate="false"
                                          type="checkbox"
                                        />
                                        <img
                                          src="test-file-stub"
                                        />
                                        <span
                                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                        />
                                      </span>
                                      <span
                                        class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                      >
                                        Pow
                                      </span>
                                    </label>
                                  </div>
                                  <div
                                    class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                                  >
                                    <label
                                      class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                    >
                                      <span
                                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                      >
                                        <input
                                          class="PrivateSwitchBase-input css-1m9pwf3"
                                          data-indeterminate="false"
                                          type="checkbox"
                                        />
                                        <img
                                          src="test-file-stub"
                                        />
                                        <span
                                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                        />
                                      </span>
                                      <span
                                        class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                      >
                                        Bang
                                      </span>
                                    </label>
                                  </div>
                                  <div
                                    class="MuiGrid-root MuiGrid-item NotificationsspacingSound css-13i4rnv-MuiGrid-root"
                                  >
                                    <label
                                      class="MuiFormControlLabel-root NotificationsradioSound MuiFormControlLabel-labelPlacementEnd css-j204z7-MuiFormControlLabel-root"
                                    >
                                      <span
                                        class="MuiButtonBase-root MuiCheckbox-root MuiCheckbox-colorPrimary PrivateSwitchBase-root MuiCheckbox-root MuiCheckbox-colorPrimary MuiCheckbox-root MuiCheckbox-colorPrimary css-hkw0i8-MuiButtonBase-root-MuiCheckbox-root"
                                      >
                                        <input
                                          class="PrivateSwitchBase-input css-1m9pwf3"
                                          data-indeterminate="false"
                                          type="checkbox"
                                        />
                                        <img
                                          src="test-file-stub"
                                        />
                                        <span
                                          class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                        />
                                      </span>
                                      <span
                                        class="MuiTypography-root MuiTypography-body1 MuiFormControlLabel-label css-ghvhpl-MuiTypography-root"
                                      >
                                        Splat
                                      </span>
                                    </label>
                                  </div>
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

  it('renders component for the owner', () => {
    const result = renderComponent(
      <Provider store={store}>
        <SettingsModal title='Settings' isOwner={true} open handleClose={jest.fn()} leaveCommunityModal={leaveCommunityModal} />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="padding-right: 1024px; overflow: hidden;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="Modalroot MuiModal-root css-1hk9oxe-MuiModal-root"
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item Modalheader ModalheaderBorder css-lx31tv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true css-1r61agb-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                >
                  <h6
                    class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-alignCenter Modaltitle Modalbold css-jxzupi-MuiTypography-root"
                    style="margin-left: 36px;"
                  >
                    Settings
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item Modalactions css-hoc6b0-MuiGrid-root"
                    data-testid="settingsModalActions"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-c8hoqc-MuiButtonBase-root-MuiIconButton-root"
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
              class="MuiGrid-root MuiGrid-container MuiGrid-item ModalfullPage css-1h16bbz-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item Modalcontent css-1f064cs-MuiGrid-root"
                style="width: 100%;"
              >
                <div
                  class="MuiGrid-root MuiGrid-container css-mjeemy-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item css-1hxrcsw-MuiGrid-root"
                    style="margin-left: 0px;"
                  >
                    <header
                      class="MuiPaper-root MuiPaper-elevation MuiPaper-elevation4 MuiAppBar-root MuiAppBar-colorPrimary MuiAppBar-positionStatic css-1ockhlj-MuiPaper-root-MuiAppBar-root-xxxxx"
                    >
                      <div
                        class="MuiTabs-root MuiTabs-vertical css-11gjkeb-MuiTabs-root"
                      >
                        <div
                          class="MuiTabs-scroller MuiTabs-fixed css-jpln7h-MuiTabs-scroller"
                          style="overflow: hidden; margin-right: 0px;"
                        >
                          <div
                            aria-orientation="vertical"
                            class="MuiTabs-flexContainer MuiTabs-flexContainerVertical css-lfwcke-MuiTabs-flexContainer"
                            role="tablist"
                          >
                            <button
                              aria-selected="false"
                              class="MuiButtonBase-root MuiTab-root TabtabRoot MuiTab-textColorInherit css-1iect55-MuiButtonBase-root-MuiTab-root"
                              data-testid="notifications-settings-tab"
                              role="tab"
                              tabindex="-1"
                              type="button"
                            >
                              Notifications
                              <span
                                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                              />
                            </button>
                            <button
                              aria-selected="true"
                              class="MuiButtonBase-root MuiTab-root TabtabRoot MuiTab-textColorInherit Mui-selected Tabselected css-1iect55-MuiButtonBase-root-MuiTab-root"
                              data-testid="invite-settings-tab"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              Add members
                              <span
                                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <span
                            class="MuiTabs-indicator SettingsModalindicator css-1dlvkit-MuiTabs-indicator"
                            style="top: 0px; height: 0px;"
                          />
                        </div>
                      </div>
                    </header>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
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
                            class="MuiGrid-root MuiGrid-item css-hkxyay-MuiGrid-root"
                            style="padding-right: 0px;"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1ebzqpc-MuiGrid-root"
                            >
                              <div
                                class="MuiGrid-root MuiGrid-container MuiGrid-item InviteToCommunitytitleDiv css-89gxc5-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item InviteToCommunitytitle css-13i4rnv-MuiGrid-root"
                                >
                                  <h3
                                    class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
                                  >
                                    Add members
                                  </h3>
                                </div>
                              </div>
                              <div
                                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                >
                                  <h5
                                    class="MuiTypography-root MuiTypography-h5 css-11l3dv4-MuiTypography-root"
                                  >
                                    Your invitation code
                                  </h5>
                                </div>
                                <div
                                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                                >
                                  <p
                                    class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                                  >
                                    To add members to 
                                    <span
                                      class="InviteToCommunitybold"
                                    >
                                      Community
                                    </span>
                                    , send them this invite code via a secure channel, e.g. Signal. You must be online the first time they join.
                                  </p>
                                </div>
                              </div>
                              <div
                                class="MuiGrid-root MuiGrid-item InviteToCommunitylinkContainer css-13i4rnv-MuiGrid-root"
                              >
                                <p
                                  class="MuiTypography-root MuiTypography-body2 css-16d47hw-MuiTypography-root"
                                  data-testid="invitation-code"
                                />
                                <button
                                  class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeSmall InviteToCommunityeyeIcon css-1pe4mpk-MuiButtonBase-root-MuiIconButton-root"
                                  tabindex="0"
                                  type="button"
                                >
                                  <svg
                                    aria-hidden="true"
                                    class="MuiSvgIcon-root MuiSvgIcon-colorPrimary MuiSvgIcon-fontSizeSmall css-1qc8nxe-MuiSvgIcon-root"
                                    data-testid="VisibilityOffIcon"
                                    focusable="false"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                                    />
                                  </svg>
                                  <span
                                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                  />
                                </button>
                              </div>
                              <div
                                class="MuiGrid-root css-vj1n65-MuiGrid-root"
                              >
                                <button
                                  class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium InviteToCommunitybutton css-1skytee-MuiButtonBase-root-MuiButton-root"
                                  tabindex="0"
                                  type="button"
                                >
                                  Copy to clipboard
                                  <span
                                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                                  />
                                </button>
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

  it('displays "Add members" tab for community owner', async () => {
    renderComponent(<SettingsModal title='string' isOwner={true} open handleClose={jest.fn()} leaveCommunityModal={leaveCommunityModal} />)
    expect(screen.queryByRole('tab', { name: /Notifications/i })).not.toBeNull()
    expect(screen.queryByRole('tab', { name: /Add members/i })).not.toBeNull()
  })

  it('does not display "Add members" tab if user is not a community owner', async () => {
    renderComponent(<SettingsModal title='string' isOwner={false} open handleClose={jest.fn()} leaveCommunityModal={leaveCommunityModal} />)
    expect(screen.queryByRole('tab', { name: /Notifications/i })).not.toBeNull()
    expect(screen.queryByRole('tab', { name: /Add members/i })).toBeNull()
  })
})
