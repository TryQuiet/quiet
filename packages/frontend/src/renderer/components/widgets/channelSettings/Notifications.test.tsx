import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Notifications } from './Notifications'
import { NotificationsOptions } from '@quiet/nectar'

describe('Notifications', () => {
  it('renders component', () => {
    const contact = {
      username: 'username'
    }
    const result = renderComponent(
      <Notifications
        channelData={contact}
        openNotificationsTab={() => {}}
        openSettingsModal={() => {}}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
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
                    class="MuiGrid-root makeStyles-titleDiv-3 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
                  >
                    <div
                      class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
                    >
                      <h3
                        class="MuiTypography-root MuiTypography-h3"
                      >
                        Notifications
                      </h3>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-channelNameDiv-4 MuiGrid-item"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body2"
                    >
                      #
                      username
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <h4
                        class="MuiTypography-root MuiTypography-h4"
                      >
                        You've muted this channel
                      </h4>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-infoDiv-7 MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root MuiTypography-body2"
                      >
                        Unmute this channel to change your notification settings.
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-contained makeStyles-button-8 MuiButton-containedPrimary MuiButton-containedSizeLarge MuiButton-sizeLarge MuiButton-fullWidth"
                        tabindex="0"
                        type="submit"
                      >
                        <span
                          class="MuiButton-label"
                        >
                          Unmute Channel
                        </span>
                        <span
                          class="MuiTouchRipple-root"
                        />
                      </button>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-captionDiv-9 MuiGrid-item"
                  >
                    <span
                      class="MuiTypography-root makeStyles-captions-10 MuiTypography-caption"
                    >
                      You can choose how to be alerted or turn off all Quiet notifications in your
                       
                      <span
                        class="makeStyles-link-11"
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
      </body>
    `)
  })
})
