import React from 'react'
import { getFactory, Community, communities } from '@quiet/state-manager'

import { IdentityPanel } from './IdentityPanel'
import { prepareStore } from '../../../testUtils/prepareStore'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('IdentityPanel', () => {
  it('renders component with username', async () => {
    const { store } = await prepareStore()

    const factory = await getFactory(store)

    const community: Community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const result = renderComponent(
      <IdentityPanel
        currentCommunity={community}
        accountSettingsModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {}
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-1"
          >
            <span
              aria-disabled="false"
              class="MuiButtonBase-root MuiButton-root makeStyles-button-2 MuiButton-text"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-3"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-4 MuiTypography-h4"
                >
                  Community_1
                </h4>
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
                  focusable="false"
                  role="presentation"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  />
                </svg>
              </span>
              <span
                class="MuiTouchRipple-root"
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
        currentCommunity={undefined}
        accountSettingsModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {}
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-85"
          >
            <span
              aria-disabled="false"
              class="MuiButtonBase-root MuiButton-root makeStyles-button-86 MuiButton-text"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-87"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-88 MuiTypography-h4"
                />
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
                  focusable="false"
                  role="presentation"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  />
                </svg>
              </span>
              <span
                class="MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `)
  })

  it("doesn't break if there's a community without a name", async () => {
    const { store } = await prepareStore()

    const factory = await getFactory(store)

    const community: Community = (
      await factory.build<typeof communities.actions.addNewCommunity>('Community')
    ).payload

    community.name = undefined

    const result = renderComponent(
      <IdentityPanel
        currentCommunity={community}
        accountSettingsModal={{
          open: false,
          handleOpen: function (_args?: any): any {},
          handleClose: function (): any {}
        }}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-root-169"
          >
            <span
              aria-disabled="false"
              class="MuiButtonBase-root MuiButton-root makeStyles-button-170 MuiButton-text"
              data-testid="settings-panel-button"
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-171"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-172 MuiTypography-h4"
                />
                <svg
                  aria-hidden="true"
                  class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall"
                  focusable="false"
                  role="presentation"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"
                  />
                </svg>
              </span>
              <span
                class="MuiTouchRipple-root"
              />
            </span>
          </div>
        </div>
      </body>
    `)
  })
})
