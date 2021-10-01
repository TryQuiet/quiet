import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IdentityPanel } from './IdentityPanel'

import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

import { Provider } from 'react-redux'
import store from '../../../store'

describe('IdentityPanel', () => {
  it('renders component with username', () => {
    const identity: Identity = {
      id: '',
      zbayNickname: '',
      hiddenService: undefined,
      dmKeys: undefined,
      peerId: undefined,
      userCsr: undefined,
      userCertificate: ''
    }
    const result = renderComponent(
      <Provider store={store}>
        <IdentityPanel identity={identity} handleSettings={jest.fn()} />
      </Provider>
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
              role="button"
              tabindex="0"
            >
              <span
                class="MuiButton-label makeStyles-buttonLabel-3"
              >
                <h4
                  class="MuiTypography-root makeStyles-nickname-4 MuiTypography-h4"
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
