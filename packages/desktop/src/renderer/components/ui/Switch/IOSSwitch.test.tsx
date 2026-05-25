import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IOSSwitch } from './IOSSwitch'

describe('IOSSwitch', () => {
  it('renders component', () => {
    const result = renderComponent(<IOSSwitch />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span
            class="MuiSwitch-root MuiSwitch-sizeMedium css-1lykcjg-MuiSwitch-root"
          >
            <span
              class="MuiButtonBase-root MuiSwitch-switchBase MuiSwitch-colorPrimary PrivateSwitchBase-root MuiSwitch-switchBase MuiSwitch-colorPrimary css-leyui1-MuiButtonBase-root-MuiSwitch-switchBase"
            >
              <input
                class="PrivateSwitchBase-input MuiSwitch-input css-1m9pwf3"
                type="checkbox"
              />
              <span
                class="MuiSwitch-thumb css-3qy1mv-MuiSwitch-thumb"
              />
            </span>
            <span
              class="MuiSwitch-track css-dnkzfa-MuiSwitch-track"
            />
          </span>
        </div>
      </body>
    `)
  })
})
