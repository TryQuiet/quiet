import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelMenuActionComponent } from './ChannelMenuAction'

describe('ChannelMenuAction', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelMenuActionComponent
        onInfo={jest.fn()}
        onMute={jest.fn()}
        onDelete={jest.fn()}
        onUnmute={jest.fn()}
        onSettings={jest.fn()}
        openNotificationsTab={jest.fn()}
        mutedFlag
        disableSettings
        notificationFilter={'1'}
      />
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
                src="test-file-stub"
              />
            </button>
          </div>
        </div>
      </body>
    `)
  })
})
