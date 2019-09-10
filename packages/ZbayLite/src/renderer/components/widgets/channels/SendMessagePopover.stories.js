import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import SendMessagePopover from './SendMessagePopover.js'

storiesOf('Components/Widgets/Channels/SendMessagePopover', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <SendMessagePopover
            username='TestUser'
            address='ztestsapling1juf4322spfp2nhmqaz5wymw8nkkxxyv06x38cel2nj6d7s8fdyd6dlsmc6efv02sf0kty2v7lfz'
            anchorEl
          />
        </Grid>
      </Grid>
    )
  })
