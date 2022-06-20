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
            class="makeStyles-wrapper-1"
          >
            <div
              class="makeStyles-indicator-2"
              style="visibility: visible;"
            >
              <p
                class="MuiTypography-root makeStyles-label-3 MuiTypography-body1"
              >
                New messages
              </p>
              <img
                class="makeStyles-icon-4"
                src="test-file-stub"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
