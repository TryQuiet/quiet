import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { MenuAction } from './MenuAction'
import MenuActionItem from './MenuActionItem'

describe('MenuAction', () => {
  it('renders component', () => {
    const result = renderComponent(
      <MenuAction icon={'icon'} iconHover={'iconHover'} offset={'0 20'}>
        <MenuActionItem onClick={jest.fn()} title='test 1' />
        <MenuActionItem onClick={jest.fn()} title='test 2' />
      </MenuAction>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-3"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-2"
                src="icon"
              />
            </span>
          </button>
        </div>
      </body>
    `)
  })
})
