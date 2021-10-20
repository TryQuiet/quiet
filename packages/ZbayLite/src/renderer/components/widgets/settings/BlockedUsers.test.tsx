import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { BlockedUsers } from './BlockedUsers'

describe('BlockedUsers', () => {
  it('renders component', () => {
    const props = {
      unblock: jest.fn(),
      users: [],
      blockedUsers: []
    }
    const result = renderComponent(<BlockedUsers {...props} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-titleDiv-2 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root makeStyles-title-1 MuiGrid-item"
              >
                <h3
                  class="MuiTypography-root MuiTypography-h3"
                >
                  BlockedUsers
                </h3>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
