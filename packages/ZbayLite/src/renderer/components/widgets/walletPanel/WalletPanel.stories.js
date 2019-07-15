import React from 'react'
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'

import Paper from '@material-ui/core/Paper'

import { withStore } from '../../../../../.storybook/decorators'

import WalletPanel from '../../../containers/widgets/walletPanel/WalletPanel'
import create from '../../../store/create'
import { IdentityState, Identity } from '../../../store/handlers/identity'

const store = create({
  initialState: Immutable.Map({
    identity: IdentityState({
      data: Identity({
        address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
        transparentAddress: 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1',
        balance: '33.583004',
        transparentBalance: new BigNumber('12.23')
      })
    })
  })
})

storiesOf('Containers/Widgets/WallePanel/WalletPanel', module)
  .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <Paper style={{ witdh: 300 }}>
        <WalletPanel getBalance={action('getBalance')} />
      </Paper>
    )
  })
