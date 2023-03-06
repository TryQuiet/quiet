/* eslint import/first: 0 */
import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import AccountSettingsComponent from './AccountSettingsComponent'
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

    const result = renderComponent(<AccountSettingsComponent user={user} />)
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
