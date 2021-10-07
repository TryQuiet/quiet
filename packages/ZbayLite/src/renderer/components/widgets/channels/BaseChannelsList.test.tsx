import React from 'react'

import { BaseChannelsList } from './BaseChannelsList'
import { Contact } from '../../../store/handlers/contacts'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('BaseChannelsList', () => {
  it('renders component', () => {
    const channels = [new Contact()]
    const unknownMessages = [new Contact()]
    const directMessages = false
    const result = renderComponent(
      <BaseChannelsList
        channels={channels}
        unknownMessages={unknownMessages}
        directMessages={directMessages}
        selected={{}}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <ul
            class="MuiList-root"
          >
            <div
              aria-disabled="false"
              class="MuiButtonBase-root MuiListItem-root makeStyles-root-5 MuiListItem-button"
              role="button"
              tabindex="0"
            >
              <div
                class="MuiListItemText-root makeStyles-itemText-12"
              >
                <span
                  class="MuiTypography-root MuiListItemText-primary makeStyles-primary-7 MuiTypography-body1"
                >
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    />
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-title-8 MuiTypography-body2"
                      >
                        # undefined
                      </p>
                    </div>
                  </div>
                </span>
              </div>
              <span
                class="MuiTouchRipple-root"
              />
            </div>
          </ul>
        </div>
      </body>
    `)
  })
})
