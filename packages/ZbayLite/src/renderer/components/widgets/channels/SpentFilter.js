import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Slider from '../../ui/Slider'

const styles = {
  title: {
    fontSize: '0.83rem'
  }
}

export const SpentFilter = ({ classes, value, handleOnChange }) => (
  <Grid
    container
    direction='column'
    justify='center'
    alignItems='center'
  >
    <Grid item>
      <Typography variant='body2' className={classes.title}>
        Ad spend
      </Typography>
    </Grid>
    <Grid item>
      <Slider
        title='Min threshold'
        minLabel='$0'
        maxLabel='$max'
        min={0}
        max={100}
        value={value === -1 ? 100 : value}
        handleOnChange={handleOnChange}
      />
    </Grid>
  </Grid>
)

SpentFilter.propTypes = {
  classes: PropTypes.object.isRequired,
  value: PropTypes.number.isRequired,
  handleOnChange: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SpentFilter)
