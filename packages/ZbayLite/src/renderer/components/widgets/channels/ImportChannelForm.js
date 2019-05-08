import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import VpnKeyIcon from '@material-ui/icons/VpnKey'

import ProgressFab from '../../ui/ProgressFab'

const styles = theme => ({
  content: {
    padding: theme.spacing.unit * 4
  },
  subfieldTitle: {
    fontSize: '0.9rem'
  },
  fab: {
    marginLeft: 2 * theme.spacing.unit
  }
})

export const ImportChannelForm = ({
  classes,
  enqueueSnackbar,
  onDecode,
  decoding,
  decoded
}) => {
  const [uri, setUri] = useState('')
  return (
    !decoded
      ? (
        <Grid container className={classes.content}>
          <Typography variant='subtitle1' className={classes.subfieldTitle}>
            Channel URI
          </Typography>
          <Grid item container direction='row'>
            <Grid item xs>
              <TextField
                id='channel-uri'
                margin='none'
                variant='outlined'
                placeholder='zbay.io/channel/...'
                value={uri}
                onChange={e => setUri(e.target.value)}
                inputProps={{
                  className: classes.input
                }}
                InputProps={{
                  classes: {
                    multiline: classes.multiline
                  }
                }}
                fullWidth
              />
            </Grid>
            <ProgressFab
              className={classes.fab}
              label='Unlock'
              onClick={() => onDecode(uri)}
              loading={decoding}
              success={decoded}
              disabled={decoded}
            >
              <VpnKeyIcon />
            </ProgressFab>
          </Grid>
        </Grid>
      )
      : null
  )
}

ImportChannelForm.propTypes = {
  classes: PropTypes.object.isRequired,
  onDecode: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  decoding: PropTypes.bool.isRequired,
  decoded: PropTypes.bool.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ImportChannelForm)
