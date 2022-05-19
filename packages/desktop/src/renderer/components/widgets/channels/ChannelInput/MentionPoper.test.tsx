import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'
import { MentionPoper } from './MentionPoper'

describe('MentionPoper', () => {
  it('renders component highlight', () => {
    const anchor: HTMLDivElement = document.createElement('div')
    const result = renderComponent(
      <MentionPoper anchorEl={anchor} selected={1}>
        <div />
        <div />
        <div />
      </MentionPoper>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
        <div
          class="makeStyles-root-1"
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
                    >
                      <div />
                      <div />
                      <div />
                    </div>
                    <div
                      class="makeStyles-divider-3"
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
                  class="makeStyles-thumb-2"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
