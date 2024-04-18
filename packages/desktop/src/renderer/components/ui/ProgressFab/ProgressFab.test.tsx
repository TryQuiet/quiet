import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ProgressFab } from './ProgressFab'

describe('ProgressFab', () => {
  const Icon = () => <div>Icon</div>

  it('renders component', () => {
    const result = renderComponent(
      <ProgressFab onClick={jest.fn()}>
        <Icon />
      </ProgressFab>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ProgressFabwrapper css-jv05tx"
          >
            <button
              class="MuiButtonBase-root MuiFab-root ProgressFabroot MuiFab-circular MuiFab-sizeLarge MuiFab-default MuiFab-root ProgressFabroot MuiFab-circular MuiFab-sizeLarge MuiFab-default css-1g105mj-MuiButtonBase-root-MuiFab-root"
              tabindex="0"
              type="button"
            >
              <div>
                Icon
              </div>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </button>
          </div>
        </div>
      </body>
    `)
  })

  it('renders success', () => {
    const result = renderComponent(
      <ProgressFab onClick={jest.fn()} success>
        <Icon />
      </ProgressFab>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ProgressFabwrapper css-jv05tx"
          >
            <button
              class="MuiButtonBase-root MuiFab-root ProgressFabroot ProgressFabbuttonSuccess MuiFab-circular MuiFab-sizeLarge MuiFab-default MuiFab-root ProgressFabroot ProgressFabbuttonSuccess MuiFab-circular MuiFab-sizeLarge MuiFab-default css-1g105mj-MuiButtonBase-root-MuiFab-root"
              tabindex="0"
              type="button"
            >
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                data-testid="CheckIcon"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                />
              </svg>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </button>
          </div>
        </div>
      </body>
    `)
  })

  it('renders loading', () => {
    const result = renderComponent(
      <ProgressFab onClick={jest.fn()} loading>
        <Icon />
      </ProgressFab>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ProgressFabwrapper css-jv05tx"
          >
            <button
              class="MuiButtonBase-root MuiFab-root ProgressFabroot MuiFab-circular MuiFab-sizeLarge MuiFab-default MuiFab-root ProgressFabroot MuiFab-circular MuiFab-sizeLarge MuiFab-default css-1g105mj-MuiButtonBase-root-MuiFab-root"
              tabindex="0"
              type="button"
            >
              <div>
                Icon
              </div>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </button>
            <span
              class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary ProgressFabfabProgress css-acfop9-MuiCircularProgress-root"
              role="progressbar"
              style="width: 68px; height: 68px;"
            >
              <svg
                class="MuiCircularProgress-svg css-1idz92c-MuiCircularProgress-svg"
                viewBox="22 22 44 44"
              >
                <circle
                  class="MuiCircularProgress-circle MuiCircularProgress-circleIndeterminate css-176wh8e-MuiCircularProgress-circle"
                  cx="44"
                  cy="44"
                  fill="none"
                  r="20.2"
                  stroke-width="3.6"
                />
              </svg>
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it('renders disabled', () => {
    const result = renderComponent(
      <ProgressFab onClick={jest.fn()} success disabled>
        <Icon />
      </ProgressFab>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ProgressFabwrapper css-jv05tx"
          >
            <button
              class="MuiButtonBase-root MuiFab-root ProgressFabroot ProgressFabbuttonSuccess MuiFab-circular MuiFab-sizeLarge MuiFab-default Mui-disabled MuiFab-root ProgressFabroot ProgressFabbuttonSuccess MuiFab-circular MuiFab-sizeLarge MuiFab-default css-1g105mj-MuiButtonBase-root-MuiFab-root"
              disabled=""
              tabindex="-1"
              type="button"
            >
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root"
                data-testid="CheckIcon"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                />
              </svg>
            </button>
          </div>
        </div>
      </body>
    `)
  })
})
