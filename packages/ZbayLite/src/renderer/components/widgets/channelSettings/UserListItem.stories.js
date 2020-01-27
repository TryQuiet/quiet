import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import UserListItem from './UserListItem.js'

storiesOf('Components/Widgets/ChannelSettings/UserListItem', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid
        container
        direction='column'
        style={{ width: 350, backgroundColor: 'white' }}
      >
        <Grid item>
          <UserListItem
            name='TestUser'
            actionName='Unblock'
            action={() => {
              console.log('unblock')
            }}
            anchorEl
          />
        </Grid>
      </Grid>
    )
  })
