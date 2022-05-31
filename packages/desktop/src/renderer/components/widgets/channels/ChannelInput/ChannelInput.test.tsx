import React from 'react'

import { ChannelInputComponent } from './ChannelInput'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { INPUT_STATE } from './InputState.enum'

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = renderComponent(
      <ChannelInputComponent
        channelAddress={'channelAddress'}
        channelName={'channelName'}
        inputPlaceholder='#channel as @user'
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        infoClass={''}
        setInfoClass={jest.fn()}
        openFilesDialog={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1"
          >
            <div
              class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-inputsDiv-5 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
              >
                <div
                  class="MuiGrid-root makeStyles-textfield-4 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-input-3"
                      contenteditable="true"
                      data-testid="messageInput"
                      placeholder="Message #channel as @user"
                    >
                      
                    </div>
                  </div>
                  <div
                    class="makeStyles-icons-22"
                  >
                    <div
                      class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-12"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-12"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-128 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
  it('renders component input unavailable', () => {
    const result = renderComponent(
      <ChannelInputComponent
        channelAddress={'channelAddress'}
        channelName={'channelName'}
        inputPlaceholder='#channel as @user'
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        infoClass={''}
        setInfoClass={jest.fn()}
        inputState={INPUT_STATE.NOT_CONNECTED}
        openFilesDialog={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-129 makeStyles-notAllowed-148"
          >
            <div
              class="MuiGrid-root makeStyles-root-129 MuiGrid-container MuiGrid-direction-xs-column MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-inputsDiv-133 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
              >
                <div
                  class="MuiGrid-root makeStyles-textfield-132 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-center MuiGrid-grid-xs-true"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-input-131"
                      contenteditable="false"
                      data-testid="messageInput"
                      disabled=""
                      placeholder="Message #channel as @user"
                    >
                      
                    </div>
                  </div>
                  <div
                    class="makeStyles-icons-150"
                  >
                    <div
                      class="MuiGrid-root makeStyles-actions-142 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-140"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root makeStyles-actions-142 MuiGrid-item"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                      >
                        <img
                          class="makeStyles-emoji-140"
                          src="test-file-stub"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-256 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <span
                    class="MuiTypography-root makeStyles-info-254 MuiTypography-caption"
                  >
                    Initializing community. This may take a few minutes...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
