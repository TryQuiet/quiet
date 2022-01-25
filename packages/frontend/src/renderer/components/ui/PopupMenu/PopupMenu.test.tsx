import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { PopupMenu } from './PopupMenu'

describe('PopupMenu', () => {
  it('renders component', () => {
    const Content = () => <div>Content</div>
    const result = renderComponent(
      <PopupMenu open>
        <Content />
      </PopupMenu>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-popper-6"
            role="tooltip"
            style="position: fixed; top: 0px; left: 0px;"
          >
            <div
              class="makeStyles-wrapper-1"
              style="opacity: 1; transform: scale(1, 1); transform-origin: center bottom; transition: opacity 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            >
              <div
                class="MuiPaper-root MuiPaper-elevation1 makeStyles-paper-2 MuiPaper-rounded"
              >
                <div>
                  Content
                </div>
              </div>
              <span
                class="makeStyles-bottom-4"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders when closed', () => {
    const Content = () => <div>Content</div>
    const result = renderComponent(
      <PopupMenu open={false}>
        <Content />
      </PopupMenu>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div />
      </body>
    `)
  })

  it('renders with offset', () => {
    const Content = () => <div>Content</div>
    const result = renderComponent(
      <PopupMenu open offset='0 10'>
        <Content />
      </PopupMenu>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-popper-45"
            role="tooltip"
            style="position: fixed; top: 0px; left: 0px;"
          >
            <div
              class="makeStyles-wrapper-40"
              style="opacity: 1; transform: scale(1, 1); transform-origin: center bottom; transition: opacity 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 0ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            >
              <div
                class="MuiPaper-root MuiPaper-elevation1 makeStyles-paper-41 MuiPaper-rounded"
              >
                <div>
                  Content
                </div>
              </div>
              <span
                class="makeStyles-bottom-43"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
