/* eslint import/first: 0 */
jest.mock('../../../containers/widgets/channelSettings/BlockedUsers', () => {
  const TabContent = () => <div>TabContent</div>
  return TabContent
})
jest.mock('../../../containers/widgets/channelSettings/Moderators', () => {
  const TabContent = () => <div>TabContent</div>
  return TabContent
})
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { ChannelSettingsModal } from './ChannelSettingsModal'
import { Contact } from '../../../store/handlers/contacts'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('ChannelSettingsModal', () => {
  it('renders component', () => {
    const contact = new Contact()
    const result = renderComponent(
      <Provider store={store}>
        <ChannelSettingsModal
          channel={contact}
          setCurrentTab={jest.fn()}
          handleClose={jest.fn()}
          currentTab='notifications'
          open
          isOwner={false}
          modalTabToOpen={'notifications'}
          clearCurrentOpenTab={jest.fn()}
        />
      </Provider>
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
              class="MuiGrid-root makeStyles-header-12 makeStyles-headerBorder-13 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-11 makeStyles-bold-19 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  >
                    Settings for #
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-14 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                    data-testid="ModalActions"
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
                  class="MuiGrid-root makeStyles-root-1 MuiGrid-container"
                >
                  <div
                    class="MuiGrid-root makeStyles-tabsDiv-6 MuiGrid-item"
                  >
                    <header
                      class="MuiPaper-root MuiPaper-elevation4 MuiAppBar-root MuiAppBar-positionStatic makeStyles-appbar-4 MuiAppBar-colorPrimary"
                    >
                      <div
                        class="MuiTabs-root makeStyles-tabs-2 MuiTabs-vertical"
                      >
                        <div
                          class="MuiTabs-scroller MuiTabs-fixed"
                          style="overflow: hidden;"
                        >
                          <div
                            class="MuiTabs-flexContainer MuiTabs-flexContainerVertical"
                            role="tablist"
                          >
                            <button
                              aria-selected="true"
                              class="MuiButtonBase-root MuiTab-root MuiTab-textColorInherit Mui-selected makeStyles-selected-7"
                              role="tab"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiTab-wrapper"
                              >
                                Notifications
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <span
                            class="PrivateTabIndicator-root-235 PrivateTabIndicator-colorSecondary-237 MuiTabs-indicator makeStyles-indicator-3 PrivateTabIndicator-vertical-238"
                            style="top: 0px; height: 0px;"
                          />
                        </div>
                      </div>
                    </header>
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-content-9 MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      style="overflow: visible; height: 0px; width: 0px;"
                    >
                      <div
                        class="rc-scrollbars-container"
                        style="position: relative; overflow: hidden; width: 0px; height: 0px; overflow-x: hidden;"
                      >
                        <div
                          class="rc-scrollbars-view"
                          style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                          >
                            <div
                              class="MuiGrid-root makeStyles-titleDiv-241 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
                            >
                              <div
                                class="MuiGrid-root makeStyles-title-239 MuiGrid-item"
                              >
                                <h3
                                  class="MuiTypography-root MuiTypography-h3"
                                >
                                  Notifications
                                </h3>
                              </div>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-channelNameDiv-242 MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root MuiTypography-body2"
                              >
                                #
                                unknown
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-radioDiv-243 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                            >
                              <label
                                class="MuiFormControlLabel-root makeStyles-radioIcon-244"
                              >
                                <span
                                  aria-disabled="false"
                                  class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-262 MuiCheckbox-root MuiCheckbox-colorSecondary PrivateSwitchBase-checked-263 Mui-checked MuiIconButton-colorSecondary"
                                >
                                  <span
                                    class="MuiIconButton-label"
                                  >
                                    <input
                                      checked=""
                                      class="PrivateSwitchBase-input-265"
                                      data-indeterminate="false"
                                      type="checkbox"
                                      value=""
                                    />
                                    <img
                                      src="test-file-stub"
                                    />
                                  </span>
                                  <span
                                    class="MuiTouchRipple-root"
                                  />
                                </span>
                                <span
                                  class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                                >
                                  Every new message
                                </span>
                              </label>
                              <label
                                class="MuiFormControlLabel-root makeStyles-radioIcon-244"
                              >
                                <span
                                  aria-disabled="false"
                                  class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-262 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                                >
                                  <span
                                    class="MuiIconButton-label"
                                  >
                                    <input
                                      class="PrivateSwitchBase-input-265"
                                      data-indeterminate="false"
                                      type="checkbox"
                                      value=""
                                    />
                                    <img
                                      src="test-file-stub"
                                    />
                                  </span>
                                  <span
                                    class="MuiTouchRipple-root"
                                  />
                                </span>
                                <span
                                  class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                                >
                                  Just @mentions
                                </span>
                              </label>
                              <label
                                class="MuiFormControlLabel-root makeStyles-radioIcon-244"
                              >
                                <span
                                  aria-disabled="false"
                                  class="MuiButtonBase-root MuiIconButton-root PrivateSwitchBase-root-262 MuiCheckbox-root MuiCheckbox-colorSecondary MuiIconButton-colorSecondary"
                                >
                                  <span
                                    class="MuiIconButton-label"
                                  >
                                    <input
                                      class="PrivateSwitchBase-input-265"
                                      data-indeterminate="false"
                                      type="checkbox"
                                      value=""
                                    />
                                    <img
                                      src="test-file-stub"
                                    />
                                  </span>
                                  <span
                                    class="MuiTouchRipple-root"
                                  />
                                </span>
                                <span
                                  class="MuiTypography-root MuiFormControlLabel-label MuiTypography-body1"
                                >
                                  Nothing
                                </span>
                              </label>
                            </div>
                            <div
                              class="MuiGrid-root makeStyles-captionDiv-247 MuiGrid-item"
                            >
                              <span
                                class="MuiTypography-root makeStyles-captions-248 MuiTypography-caption"
                              >
                                You can choose how to be alerted or turn off all Zbay notifications in your
                                 
                                <span
                                  class="makeStyles-link-249"
                                >
                                  Notification Settings
                                </span>
                                .
                              </span>
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
            data-test="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })
})
