import React from 'react'

import { DateTime } from 'luxon'
import { now } from '../../../../testUtils'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { InviteMentionInfo } from './InviteMentionInfo'

describe('InviteMentionInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })
  it('renders component', () => {
    const result = renderComponent(
      <InviteMentionInfo
        handleClose={jest.fn()}
        handleInvite={jest.fn()}
        nickname='test'
        timeStamp={0}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-2 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-1 MuiListItemText-multiline"
            >
              <p
                class="MuiTypography-root makeStyles-visibleInfo-8 MuiTypography-body2"
              >
                Only visible to you
              </p>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-4 MuiGrid-item"
                >
                  <img
                    class="makeStyles-icon-7"
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
                        class="MuiTypography-root makeStyles-username-3 MuiTypography-body1 MuiTypography-colorTextPrimary"
                      >
                        Zbay
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-time-12 MuiTypography-body1"
                      >
                        0:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-messageInput-6 MuiGrid-container MuiGrid-direction-xs-column"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-message-5 MuiTypography-body2"
                  >
                    You mentioned
                     
                    <span
                      class="makeStyles-highlight-9"
                    >
                      @
                      test
                    </span>
                    , but they're not a participant in this channel.
                  </p>
                </div>
                <div
                  class="MuiGrid-root makeStyles-buttonsDiv-11 MuiGrid-item"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-spacing-xs-1"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <button
                        class="MuiButtonBase-root MuiButton-root MuiButton-outlined makeStyles-button-10"
                        tabindex="0"
                        type="button"
                      >
                        <span
                          class="MuiButton-label"
                        >
                          Invite 
                          test
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
                        class="MuiButtonBase-root MuiButton-root MuiButton-outlined makeStyles-button-10"
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
      </body>
    `)
  })
})
