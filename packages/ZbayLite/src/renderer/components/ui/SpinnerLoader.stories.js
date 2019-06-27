import React from 'react'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'

import Typography from '@material-ui/core/Typography'

import SpinnerLoader, { withSpinnerLoader } from './SpinnerLoader'
import { LoaderState } from '../../store/handlers/utils'

storiesOf('Components/UI/SpinnerLoader', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <Paper style={{ padding: '16px 0px', width: 300, height: 200 }}>
      <Grid container direction='column' style={{ minHeight: '100%', width: 300 }}>
        <SpinnerLoader message={text('Loading message', 'Loading something')} />
      </Grid>
    </Paper>
  ))
  .add('withSpinnerLoader', () => {
    const C = ({ name }) => (
      <Typography>Hello {name}</Typography>
    )
    const Wrapped = withSpinnerLoader(C)
    const loader = LoaderState({
      loading: boolean('Loading', false),
      message: text('Loading message', 'Loading something')
    })
    return (
      <Paper style={{ padding: '16px 0px', width: 300, height: 200 }}>
        <Grid container direction='column' style={{ minHeight: '100%', width: 300 }}>
          <Wrapped loader={loader} name='Handsome' />
        </Grid>
      </Paper>
    )
  })
