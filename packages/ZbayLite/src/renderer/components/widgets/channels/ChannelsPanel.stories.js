import React from 'react'
import Immutable from 'immutable'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import * as R from 'ramda'

import { withStore } from '../../../../../.storybook/decorators'
import { createChannel } from '../../../testUtils'
import create from '../../../store/create'
import ChannelsPanel from './ChannelsPanel'

const store = create({
  initialState: Immutable.Map({
  })
})

storiesOf('Components/Widgets/Channels/ChannelsPanel', module)
  .addDecorator(withKnobs)
  .addDecorator(withStore(store))
  .addDecorator(StoryRouter())
  .add('playground', () => {
    const channels = Immutable.fromJS(
      R.range(0, 4).map(createChannel)
    )
    return (
      <Paper style={{ padding: '16px 0px', width: 300, height: 300 }}>
        <Grid container direction='column' style={{ minHeight: '100%', width: 300 }}>
          <ChannelsPanel
            channels={channels}
            loading={boolean('Loading', false)}
          />
        </Grid>
      </Paper>
    )
  })
