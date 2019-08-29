import React from 'react'
import Immutable from 'immutable'
import { storiesOf } from '@storybook/react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import Grid from '@material-ui/core/Grid'

import { withStore } from '../../../../../../.storybook/decorators'
import create from '../../../../store/create'
import ChannelInput from './ChannelInput'

const store = create({
  initialState: Immutable.Map()
})

storiesOf('Components/Widgets/Channels/ChannelInput', module)
  .addDecorator(withKnobs)
  .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <Grid container style={{ width: 724 }}>
        <ChannelInput
          inputState={number(0)}
          onChange={action('onChange')}
          onKeyPress={action('onKeyPress')}
        />
      </Grid>
    )
  })
