import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { BlockedUsers } from './BlockedUsers'

describe('BlockedUsers', () => {
  it('renders component', () => {
    const users = {
      pubKey: {
        nickname: 'name'
      }
    }
    const result = renderComponent(
      <BlockedUsers users={users} blockedUsers={['']} unblockUser={() => { }} />
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
                    class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
                  >
                    <h3
                      class="MuiTypography-root MuiTypography-h3"
                    >
                      Blocked users
                    </h3>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item"
                  >
                    <div
                      class="MuiGrid-root makeStyles-root-135 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between MuiGrid-grid-xs-true"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <h6
                          class="MuiTypography-root makeStyles-name-136 MuiTypography-subtitle1"
                        >
                          @
                          
                        </h6>
                      </div>
                      <div
                        class="MuiGrid-root makeStyles-pointer-138 MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-actionName-137 MuiTypography-body2"
                        >
                          Unblock
                        </p>
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
      </body>
    `)
  })
})
