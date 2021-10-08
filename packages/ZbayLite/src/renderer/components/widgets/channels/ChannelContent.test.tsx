import React from 'react'
import { Provider } from 'react-redux'

import { ChannelContent } from './ChannelContent'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Mentions } from '../../../store/handlers/mentions'
import store from '../../../store'
import { DateTime } from 'luxon'
import { now } from '../../../testUtils'

describe('ChannelContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const mentions = { channelId: [new Mentions({ nickname: '', timeStamp: 100000 })] }
    const result = renderComponent(
      <Provider store={store}>
        <ChannelContent
          channelType={CHANNEL_TYPE.NORMAL}
          measureRef={React.createRef()}
          contentRect={''}
          mentions={mentions}
          sendInvitation={jest.fn()}
          removeMention={jest.fn()}
          inputState={''}
          contactId={''}
          signerPubKey={''}
          offer={''}
          tab={jest.fn()}
        />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-fullHeight-1 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="rc-scrollbars-container"
                style="position: relative; overflow: hidden; width: 100%; height: 100%;"
              >
                <div
                  class="rc-scrollbars-view"
                  style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
                >
                  <ul
                    class="MuiList-root makeStyles-list-106"
                    id="messages-scroll"
                  />
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
              class="MuiGrid-root makeStyles-mentionsDiv-2 MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <li
                  class="MuiListItem-root makeStyles-wrapper-117 MuiListItem-gutters"
                >
                  <div
                    class="MuiListItemText-root makeStyles-messageCard-116 MuiListItemText-multiline"
                  >
                    <p
                      class="MuiTypography-root makeStyles-visibleInfo-123 MuiTypography-body2"
                    >
                      Only visible to you
                    </p>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
                    >
                      <div
                        class="MuiGrid-root makeStyles-avatar-119 MuiGrid-item"
                      >
                        <img
                          class="makeStyles-icon-122"
                          src="test-file-stub"
                        />
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-space-between"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start MuiGrid-grid-xs-true"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-username-118 MuiTypography-body1 MuiTypography-colorTextPrimary"
                            >
                              Zbay
                            </p>
                          </div>
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-time-127 MuiTypography-body1"
                            >
                              3:46 am
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-messageInput-121 MuiGrid-container MuiGrid-direction-xs-column"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-message-120 MuiTypography-body2"
                        >
                          You mentioned 
                          <span
                            class="makeStyles-highlight-124"
                          >
                            @
                            
                          </span>
                          , but they're not a participant in this channel.
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root makeStyles-buttonsDiv-126 MuiGrid-item"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <button
                              class="MuiButtonBase-root MuiButton-root MuiButton-outlined makeStyles-button-125"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiButton-label"
                              >
                                Invite 
                                
                              </span>
                              <span
                                class="MuiTouchRipple-root"
                              />
                            </button>
                          </div>
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <button
                              class="MuiButtonBase-root MuiButton-root MuiButton-outlined makeStyles-button-125"
                              tabindex="0"
                              type="button"
                            >
                              <span
                                class="MuiButton-label"
                              >
                                Do Nothing
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
                </li>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
