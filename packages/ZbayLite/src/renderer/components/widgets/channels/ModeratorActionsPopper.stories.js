import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'

import ModeratorActionsPopper from './ModeratorActionsPopper'

storiesOf('Components/Widgets/Channels/ModeratorActionsPoppers', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .add('playground', () => {
    return (
      <Grid
        container
        style={{ height: '400px' }}
        direction='column'
        spacing={2}
        justify='center'
        alignItems='center'
      >
        <Grid item style={{}}>
          <ModeratorActionsPopper
            name={'Bohdan'}
            address={
              'ztestsapling1aa0jnmxynftcwf8kcymprpmzfddwhn7mc68y2xnrthhhshdw220p32z5aufrl68tasulxltwlsv'
            }
            open
          />
        </Grid>
      </Grid>
    )
  })
