import React from 'react'
import { fireEvent } from '@testing-library/react'
import { getReduxStoreFactory, communities } from '@quiet/state-manager'

import { IdentityPanel } from './IdentityPanel'
import { prepareStore, testReducers } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Community } from '@quiet/types'

describe('IdentityPanel', () => {
  it('renders component with username', async () => {
    const { store } = await prepareStore()

    const factory = await getReduxStoreFactory(store)

    const community: Community = await factory.create('Community')

    const result = renderComponent(
      <IdentityPanel
        currentCommunity={community}
        accountSettingsModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {},
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="IdentityPanelroot css-15v2td"
          >
            <button
              class="IdentityPanelbutton"
              data-testid="settings-panel-button"
              type="button"
            >
              <span
                aria-hidden="true"
                class="CommunityIconroot css-1spqh73"
              >
                C
              </span>
              <span
                class="IdentityPanelnameGroup"
              >
                <h4
                  class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-1inrl58-MuiTypography-root"
                  data-testid="current-community-name"
                >
                  community_1
                </h4>
                <span
                  class="IdentityPanelcaret"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    focusable="false"
                    height="16"
                    viewBox="0 0 16 16"
                    width="16"
                  >
                    <path
                      d="M11.5246 7.09375H4.47265C4.2937 7.09375 4.20482 7.31075 4.33234 7.43628L7.84462 10.8937C7.92224 10.9701 8.04674 10.9703 8.12467 10.8942L11.6644 7.43683C11.7927 7.31153 11.704 7.09375 11.5246 7.09375Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </body>
    `)
  })

  /**
   * The community row is the only way into the community menu, and since the sidebar column has
   * no Add members row of its own (user decision, 2026-09-22) it is the only way to Add members
   * too. It opens the drawer on the menu, not on a tab: the modal reducer keeps a previous
   * caller's args, so the row passes its own empty ones rather than inheriting a tab.
   */
  it('opens the community menu, on the menu rather than a tab', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community: Community = await factory.create('Community')
    const handleOpen = jest.fn()

    const result = renderComponent(
      <IdentityPanel
        currentCommunity={community}
        accountSettingsModal={{
          open: false,
          handleOpen,
          handleClose: function (): any {},
        }}
      />
    )

    fireEvent.click(result.getByTestId('settings-panel-button'))

    expect(handleOpen).toHaveBeenCalledTimes(1)
    expect(handleOpen).toHaveBeenCalledWith({})
  })

  it("doesn't break if there's no community", async () => {
    const result = renderComponent(
      <IdentityPanel
        // @ts-expect-error
        currentCommunity={undefined}
        accountSettingsModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {},
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="IdentityPanelroot css-15v2td"
          >
            <button
              class="IdentityPanelbutton"
              data-testid="settings-panel-button"
              type="button"
            >
              <span
                aria-hidden="true"
                class="CommunityIconroot css-1spqh73"
              >
                .
              </span>
              <span
                class="IdentityPanelnameGroup"
              >
                <h4
                  class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-1inrl58-MuiTypography-root"
                  data-testid="current-community-name"
                >
                  ...
                </h4>
                <span
                  class="IdentityPanelcaret"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    focusable="false"
                    height="16"
                    viewBox="0 0 16 16"
                    width="16"
                  >
                    <path
                      d="M11.5246 7.09375H4.47265C4.2937 7.09375 4.20482 7.31075 4.33234 7.43628L7.84462 10.8937C7.92224 10.9701 8.04674 10.9703 8.12467 10.8942L11.6644 7.43683C11.7927 7.31153 11.704 7.09375 11.5246 7.09375Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </body>
    `)
  })
})
