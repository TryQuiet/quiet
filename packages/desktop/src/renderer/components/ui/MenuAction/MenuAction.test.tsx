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
          <div
            class="css-164bpf2"
          >
            <button
              class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge MenuActionbutton css-1awz4e2-MuiButtonBase-root-MuiIconButton-root"
              tabindex="0"
              type="button"
            >
              <img
                class="MenuActionicon"
                src="icon"
              />
            </button>
          </div>
        </div>
      </body>
    `)
  })
})
