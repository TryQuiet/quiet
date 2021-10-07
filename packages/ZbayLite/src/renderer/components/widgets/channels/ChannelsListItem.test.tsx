import React from 'react'
import { ChannelsListItem } from './ChannelsListItem'

import { Contact } from '../../../store/handlers/contacts'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelsListItem', () => {
  it('renders component public channel', () => {
    const channel = new Contact()
    const result = renderComponent(
      <ChannelsListItem channel={channel} selected={{}} directMessages={false} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-disabled="false"
            class="MuiButtonBase-root MuiListItem-root makeStyles-root-1 MuiListItem-button"
            role="button"
            tabindex="0"
          >
            <div
              class="MuiListItemText-root makeStyles-itemText-8"
            >
              <span
                class="MuiTypography-root MuiListItemText-primary makeStyles-primary-3 MuiTypography-body1"
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
                      class="MuiTypography-root makeStyles-title-4 MuiTypography-body2"
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
        </div>
      </body>
    `)
  })

  it('renders component direct messages channel', () => {
    const channel = new Contact()
    const result = renderComponent(
      <ChannelsListItem channel={channel} selected={{}} directMessages={true} />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-disabled="false"
            class="MuiButtonBase-root MuiListItem-root makeStyles-root-172 MuiListItem-button"
            role="button"
            tabindex="0"
          >
            <div
              class="MuiListItemText-root makeStyles-itemText-179"
            >
              <span
                class="MuiTypography-root MuiListItemText-primary makeStyles-primary-174 MuiTypography-body1"
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
                      class="MuiTypography-root makeStyles-title-175 MuiTypography-body2"
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
        </div>
      </body>
    `)
  })
})
