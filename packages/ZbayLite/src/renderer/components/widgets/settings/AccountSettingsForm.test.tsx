/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { AccountSettingsForm } from './AccountSettingsForm'
import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'

describe('AccountSettingsForm', () => {
  it('renders component', () => {
    const user = new Identity({
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
      }
    })

    const result = renderComponent(<AccountSettingsForm user={user} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root makeStyles-title-8 MuiGrid-item"
            >
              <h3
                class="MuiTypography-root MuiTypography-h3"
              >
                Account
              </h3>
            </div>
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-justify-xs-center"
            >
              <div
                class="MuiGrid-root makeStyles-createUsernameContainer-1 MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"
                >
                  <h4
                    class="MuiTypography-root MuiTypography-h4"
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
