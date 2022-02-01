import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { UserListItem } from './UserListItem'

describe('UserListItem', () => {
  it('renders component', () => {
    const result = renderComponent(
      <UserListItem
        name='testname'
        action={() => {}}
        disableConfirmation
        actionName='testactionname'
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between MuiGrid-grid-xs-true"
          >
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <h6
                class="MuiTypography-root makeStyles-name-2 MuiTypography-subtitle1"
              >
                @
                testname
              </h6>
            </div>
            <div
              class="MuiGrid-root makeStyles-pointer-4 MuiGrid-item"
            >
              <p
                class="MuiTypography-root makeStyles-actionName-3 MuiTypography-body2"
              >
                testactionname
              </p>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
