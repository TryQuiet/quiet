import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { SidebarHeader } from './SidebarHeader'

describe('SidebarHeader', () => {
  it('renders component', () => {
    const result = renderComponent(
      <SidebarHeader title='sample title' action={jest.fn()} actionTitle={jest.fn()} tooltipText='sample text' />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container SidebarHeaderroot css-1tia2hp-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <p
                class="MuiTypography-root MuiTypography-body2 SidebarHeadertitle css-16d47hw-MuiTypography-root"
              >
                sample title
              </p>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <span>
                <button
                  class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeLarge SidebarHeadericonButton css-1pux6rn-MuiButtonBase-root-MuiIconButton-root"
                  data-mui-internal-clone-element="true"
                  data-testid="addChannelButton"
                  tabindex="0"
                  type="button"
                >
                  <svg
                    fill="none"
                    height="18"
                    viewBox="0 0 24 24"
                    width="18"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.0499 12C22.0499 17.5505 17.5504 22.05 12 22.05C6.44949 22.05 1.94995 17.5505 1.94995 12C1.94995 6.44955 6.44949 1.95001 12 1.95001C17.5504 1.95001 22.0499 6.44955 22.0499 12Z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <path
                      clip-rule="evenodd"
                      d="M17.3415 12.5982H12.5983V17.3415H11.4018V12.5982H6.65857V11.4018H11.4018V6.65851H12.5983V11.4018H17.3415V12.5982Z"
                      fill="white"
                      fill-rule="evenodd"
                    />
                  </svg>
                  <span
                    class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
                  />
                </button>
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
