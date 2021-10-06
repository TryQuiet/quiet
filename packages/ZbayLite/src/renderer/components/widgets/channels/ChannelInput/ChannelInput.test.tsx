import React from 'react'

import { INPUT_STATE } from '../../../../store/selectors/channel'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { ChannelInput } from './ChannelInput'

describe('ChannelInput', () => {
  it('renders component input available ', () => {
    const result = renderComponent(
      <ChannelInput
        onChange={jest.fn()}
        onKeyPress={jest.fn()}
        message='This is just a test message'
        inputState={INPUT_STATE.AVAILABLE}
        channelName={'test'}
        users={[]}
        inputPlaceholder='test'
        isMessageTooLong={false}
        infoClass={''}
        setInfoClass={jest.fn()}
        id={''}
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
                      placeholder="Message test"
                    >
                      This is just a test message
                      
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-actions-14 MuiGrid-item"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                    >
                      <img
                        class="makeStyles-emoji-13"
                        src="test-file-stub"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-boot-129 MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          class="makeStyles-root-124"
          role="tooltip"
          style="position: fixed; top: 0px; left: 0px; transform: translate3d(0px,0px,0px; z-index: -1;"
        >
          <div
            class="MuiPaper-root MuiPaper-elevation1 MuiPaper-rounded"
          >
            <div
              class="rc-scrollbars-container"
              style="position: relative; overflow: hidden; width: 100%; height: 0px;"
            >
              <div
                class="rc-scrollbars-view"
                style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
              >
                <div
                  class="MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                    />
                    <div
                      class="makeStyles-divider-126"
                    />
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
                  class="makeStyles-thumb-125"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
