import React from 'react'
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
            class="css-1c9y83e"
          >
            <span
              class="MuiButtonBase-root MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium css-1rwf87u-MuiButtonBase-root-MuiButton-root"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <h4
                class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-ajdqea-MuiTypography-root"
                data-testid="current-community-name"
              >
                community_1
              </h4>
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-ptiqhd-MuiSvgIcon-root"
                data-testid="ArrowDropDownIcon"
                focusable="false"
                style="margin-left: 4px;"
                viewBox="0 0 24 24"
              >
                <path
                  d="m7 10 5 5 5-5z"
                />
              </svg>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `)
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
            class="css-1c9y83e"
          >
            <span
              class="MuiButtonBase-root MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium css-1rwf87u-MuiButtonBase-root-MuiButton-root"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <h4
                class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-ajdqea-MuiTypography-root"
                data-testid="current-community-name"
              >
                ...
              </h4>
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-ptiqhd-MuiSvgIcon-root"
                data-testid="ArrowDropDownIcon"
                focusable="false"
                style="margin-left: 4px;"
                viewBox="0 0 24 24"
              >
                <path
                  d="m7 10 5 5 5-5z"
                />
              </svg>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it("doesn't break if there's a community without a name", async () => {
    const { store } = await prepareStore()

    const factory = await getReduxStoreFactory(store)

    const community: Community = (await factory.build('Community')).payload

    community.name = undefined

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
            class="css-1c9y83e"
          >
            <span
              class="MuiButtonBase-root MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root IdentityPanelbutton MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium css-1rwf87u-MuiButtonBase-root-MuiButton-root"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <h4
                class="MuiTypography-root MuiTypography-h4 IdentityPanelnickname css-ajdqea-MuiTypography-root"
                data-testid="current-community-name"
              >
                ...
              </h4>
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-ptiqhd-MuiSvgIcon-root"
                data-testid="ArrowDropDownIcon"
                focusable="false"
                style="margin-left: 4px;"
                viewBox="0 0 24 24"
              >
                <path
                  d="m7 10 5 5 5-5z"
                />
              </svg>
              <span
                class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `)
  })
})
