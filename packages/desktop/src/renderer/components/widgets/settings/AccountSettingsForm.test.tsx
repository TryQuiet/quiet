/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { AccountSettingsForm } from './AccountSettingsForm'
import { Identity } from '@quiet/state-manager'

describe('AccountSettingsForm', () => {
  it('renders component', () => {
    const user: Identity = {
      id: '',
      hiddenService: { onionAddress: '', privateKey: '' },
      peerId: {
        id: '',
        pubKey: '',
        privKey: ''
      },
      dmKeys: {
        publicKey: '',
        privateKey: ''
      },
      nickname: '',
      userCsr: undefined,
      userCertificate: '',
      joinTimestamp: null
    }

    const result = renderComponent(<AccountSettingsForm user={user} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-jbu1vb-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-item AccountSettingsFormtitle css-13i4rnv-MuiGrid-root"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3 css-ptjqt4-MuiTypography-root"
              >
                Account
              </h3>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container css-1lym95h-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true AccountSettingsFormcreateUsernameContainer css-xqag5e-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 css-1idn90j-MuiGrid-root"
                >
                  <h4
                    class="MuiTypography-root MuiTypography-h4 css-ajdqea-MuiTypography-root"
                  >
                    @
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
