import React from 'react'
import Immutable from 'immutable'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, text } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import BigNumber from 'bignumber.js'

import { withStore } from '../../../../.storybook/decorators'
import create from '../../store/create'
import { Identity } from '../../store/handlers/identity'
import { LoaderState } from '../../store/handlers/utils'
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
      address: 'sapling-private-address',
      transparentAddress: 'transparent-address',
      name: 'Mercury',
      balance: new BigNumber('32.232')
    })
    return (
      <Paper style={{ padding: '16px 0px', width: 300, height: 200 }}>
        <Grid container direction='column' style={{ minHeight: '100%', width: 300 }}>
          <IdentityPanel
            identity={identity}
            loader={LoaderState({
              loading: boolean('Loading', false),
              message: text('Loading message', 'Loading identity')
            })}
          />
        </Grid>
      </Paper>
    )
  })
