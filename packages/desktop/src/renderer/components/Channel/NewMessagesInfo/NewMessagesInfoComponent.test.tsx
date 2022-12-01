import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { NewMessagesInfoComponent } from './NewMessagesInfoComponent'

describe('NewMessagesInfoComponent', () => {
  it('renders component', () => {
    const result = renderComponent(<NewMessagesInfoComponent scrollBottom={() => {}} show={true} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="NewMessagesInfoComponentwrapper css-1gw2a0t"
            style="display: block;"
          >
            <div
              class="NewMessagesInfoComponentindicator"
            >
              <p
                class="MuiTypography-root MuiTypography-body1 NewMessagesInfoComponentlabel css-ghvhpl-MuiTypography-root"
              >
                New messages
              </p>
              <img
                class="NewMessagesInfoComponenticon"
                src="test-file-stub"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
