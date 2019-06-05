import React from 'react'
import Immutable from 'immutable'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import { withStore } from '../../../../../../.storybook/decorators'

import TopUpModal from '../../../../containers/widgets/walletPanel/TopUpModal'
import create from '../../../../store/create'
import { IdentityState, Identity } from '../../../../store/handlers/identity'

const store = create({
  initialState: Immutable.Map({
    identity: IdentityState({
      data: Identity({
        address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
        transparentAddress: 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1'
      })
    })
  })
})

storiesOf('Containers/Widgets/WallePanel/TopUpModal', module)
  .addDecorator(withKnobs)
  .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <TopUpModal
        open={boolean('Open', true)}
        handleClose={action('handleClose')}
        handleCopy={action('handleCopy')}
      />
    )
  })
