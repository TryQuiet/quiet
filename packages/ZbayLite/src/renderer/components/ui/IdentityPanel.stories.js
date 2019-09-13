import React from 'react'
import Immutable from 'immutable'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import StoryRouter from 'storybook-react-router'
import BigNumber from 'bignumber.js'

import { withStore } from '../../../../.storybook/decorators'
import create from '../../store/create'
import { Identity } from '../../store/handlers/identity'
import IdentityPanel from './IdentityPanel'

const store = create({
  initialState: Immutable.Map({})
})

storiesOf('Components/UI/IdentityPanel', module)
  .addDecorator(withKnobs)
  .addDecorator(withStore(store))
  .addDecorator(StoryRouter())
  .add('playground', () => {
    const identity = Identity({
      id: 'some-test-id',
      address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
      transparentAddress: 'transparent-address',
      name: 'Mercury',
      balance: new BigNumber('32.232')
    })
    return (
      <Paper style={{ padding: '16px 0px', width: 300, height: 200 }}>
        <Grid container direction='column' style={{ minHeight: '100%', width: 300 }}>
          <IdentityPanel
            identity={identity}
            handleSettings={action('handleSettings')}
          />
        </Grid>
      </Paper>
    )
  })
