import React from 'react'

import { ChannelMenuAction } from './ChannelMenuAction'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelMenuAction', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelMenuAction
        onInfo={jest.fn()}
        onMute={jest.fn()}
        onDelete={jest.fn()}
        onUnmute={jest.fn()}
        onSettings={jest.fn()}
        openNotificationsTab={jest.fn()}
        mutedFlag
        disableSettings
        notificationFilter={1}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-6"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-5"
                src="test-file-stub"
              />
            </span>
          </button>
        </div>
      </body>
    `)
  })
})
