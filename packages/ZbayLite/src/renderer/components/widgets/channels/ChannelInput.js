import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ChannelInputAction from '../../../containers/widgets/channels/ChannelInputAction'

const styles = theme => ({
  root: {
    background: '#fff',
    borderTop: 'solid #cbcbcb 2px',
    padding: `18px ${2 * theme.spacing.unit}px`,
    height: '100%'
  },
  input: {
    fontSize: 15
  },
  multiline: {
    padding: `10px ${2 * theme.spacing.unit}px 9px`
  }
})

export const ChannelInput = ({ classes, onChange, onKeyPress, message }) => {
  return (
    <Grid
      container
      className={classes.root}
      direction='column'
      justify='center'
    >
      <Grid container direction='row' alignItems='center' justify='center' spacing={16}>
        <Grid item xs>
          <TextField
            id='channel-input'
            multiline
            fullWidth
            margin='none'
            rowsMax='15'
            variant='outlined'
            placeholder='Send a message'
            value={message}
            onKeyPress={onKeyPress}
            onChange={onChange}
            inputProps={{
              className: classes.input
            }}
            InputProps={{
              classes: {
                multiline: classes.multiline
              }
            }}
          />
        </Grid>
        <Grid item>
          <ChannelInputAction />
        </Grid>
      </Grid>
    </Grid>
  )
}

ChannelInput.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  message: PropTypes.string
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInput)
