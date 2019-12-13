import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import DonationsSettingsForm from './DonationsSettingsForm'

storiesOf('Components/Widgets/Settings/DonationsSettingsForm', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item style={{ width: 400, backgroundColor: 'white' }}>
          <DonationsSettingsForm
            initialValues={{
              donationAddress:
                'ztestsapling1aa0jnmxynftcwf8kcymprpmzfddwhn7mc68y2xnrthhhshdw220p32z5aufrl68tasulxltwlsv'
            }}
            donationAllow='true'
            shieldingTax={boolean('shieldingTax', false)}
          />
        </Grid>
      </Grid>
    )
  })
