import React from 'react'
import BigNumber from 'bignumber.js'

import { ChannelInfoModal } from './ChannelInfoModal'
import { DOMAIN } from '../../../../shared/static'

import { Channel } from '../../../store/handlers/channel'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelInfoModal', () => {
  const uri = `https://${DOMAIN}/importchannel=channel-hash`
  it('renders component', () => {
    const channel = new Channel()
    const channelMembers = {
      ...channel,
      members: new BigNumber(2345)
    }

    const result = renderComponent(
      <ChannelInfoModal open channel={channelMembers} shareUri={uri} handleClose={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="makeStyles-root-11"
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
            class="MuiGrid-root makeStyles-centered-18 makeStyles-window-19 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            tabindex="-1"
          >
            <div
              class="MuiGrid-root makeStyles-header-13 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <h6
                    class="MuiTypography-root makeStyles-title-12 makeStyles-bold-20 MuiTypography-subtitle1 MuiTypography-alignCenter"
                    style="margin-left: 36px;"
                  >
                    Channel Information
                  </h6>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root makeStyles-actions-15 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-flex-end"
                  >
                    <button
                      class="MuiButtonBase-root MuiIconButton-root makeStyles-root-154"
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
              class="MuiGrid-root makeStyles-fullPage-17 MuiGrid-container MuiGrid-item MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-content-16 MuiGrid-container MuiGrid-item"
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
                          class="MuiGrid-root makeStyles-section-7 MuiGrid-item"
                        >
                          <h3
                            class="MuiTypography-root makeStyles-title-2 MuiTypography-h3"
                          />
                        </div>
                        <div
                          class="MuiGrid-root makeStyles-section-7 makeStyles-spacing24-5 MuiGrid-item"
                        >
                          <h6
                            class="MuiTypography-root makeStyles-infoTitle-3 MuiTypography-subtitle1"
                          >
                            About #undefined
                          </h6>
                          <p
                            class="MuiTypography-root makeStyles-description-6 MuiTypography-body2"
                          />
                        </div>
                        <div
                          class="MuiGrid-root makeStyles-section-7 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                          >
                            <div
                              class="MuiGrid-root makeStyles-spacing28-4 MuiGrid-item"
                            >
                              <h6
                                class="MuiTypography-root makeStyles-infoTitle-3 MuiTypography-subtitle1 MuiTypography-displayInline"
                              >
                                Inviting others
                              </h6>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-shareWarrning-10 MuiTypography-body2"
                              >
                                To invite others to this channel, share this link. If they don’t already have Zbay they will have a chance to download it. Once they have Zbay, opening the link in Zbay will give them access to the channel. Anyone with this link will be able to see all messages in the channel, forever, so share it carefully. (Clicking the link effectively gives the Zbay website the key, too. This is not ideal and will be fixed in an upcoming release.)
                              </p>
                            </div>
                          </div>
                          <div
                            class="MuiGrid-root makeStyles-addressBox-9 MuiGrid-container MuiGrid-item"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-description-6 MuiTypography-body2"
                              >
                                https://handlers.zbay.app/importchannel=channel-hash
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root"
                            >
                              <button
                                class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-copyButton-8"
                                tabindex="0"
                                type="button"
                              >
                                <span
                                  class="MuiButton-label"
                                >
                                  Copy to clipboard
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

  it('renders component when closed', () => {
    const channel = new Channel()
    const channelMembers = {
      ...channel,
      members: new BigNumber(2345)
    }

    const result = renderComponent(
      <ChannelInfoModal channel={channelMembers} shareUri={uri} handleClose={jest.fn()} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style=""
      >
        <div />
      </body>
    `)
  })
})
