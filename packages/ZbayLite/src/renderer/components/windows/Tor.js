import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import 'react-alice-carousel/lib/alice-carousel.css'

import Icon from '../ui/Icon'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import IconButton from '@material-ui/core/IconButton'
import RefreshIcon from '@material-ui/icons/Refresh'
import LoadindButton from '../ui/LoadingButton'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  root: {
    width: '100vw',
    height: '100vh',
    WebkitAppRegion: 'drag'
  },
  icon: {
    width: 285,
    height: 67
  },
  iconDiv: {
    marginBottom: 140,
    marginTop: 140
  },
  svg: {
    width: 100,
    height: 100
  },
  addressDiv: {},
  button: {
    width: 400,
    fontSize: 20
  },
  buttonDiv: {
    marginTop: 26
  },
  message: {
    color: theme.palette.colors.darkGray,
    fontSize: 16
  },
  error: {
    marginTop: 8,
    color: theme.palette.colors.red
  }
})

export const Tor = ({ classes, tor, setUrl, setEnabled, checkTor, createZcashNode, history }) => (
  <Grid className={classes.root} container direction='column' alignItems='center'>
    <Grid container item className={classes.iconDiv} justify='center'>
      <Icon className={classes.icon} src={icon} />
    </Grid>
    <Grid className={classes.checkbox} item>
      <FormControlLabel
        control={
          <Checkbox
            checked={tor.enabled}
            onChange={e => setEnabled({ enabled: e.target.checked })}
            color='default'
          />
        }
        label='Use Tor proxy for better security'
      />
    </Grid>
    <Grid className={classes.addressDiv} container justify='center' alignItems='center' item>
      <Grid item>
        <TextField
          label='URL of Tor proxy'
          className={classes.textField}
          value={tor.url}
          disabled={tor.enabled === false}
          onChange={e => setUrl({ url: e.target.value })}
          margin='normal'
          variant='outlined'
          required
        />
      </Grid>
      <Grid item>
        <IconButton className={classes.refresh} onClick={checkTor} disabled={tor.enabled === false}>
          <RefreshIcon fontSize='large' />
        </IconButton>
      </Grid>
    </Grid>
    {tor.error && (
      <Grid item className={classes.error}>
        <Typography variant='body2'>{tor.error}</Typography>
      </Grid>
    )}
    <Grid item className={classes.buttonDiv}>
      <LoadindButton
        color='primary'
        variant='contained'
        fullWidth
        size='large'
        margin='normal'
        text='Continue'
        onClick={() => {
          createZcashNode(tor.url)
          history.push('/vault')
        }}
        inProgress={tor.status === 'loading'}
        disabled={tor.enabled === true && tor.status !== 'stable'}
        classes={{ button: classes.button }}
      />
    </Grid>
  </Grid>
)

Tor.propTypes = {
  classes: PropTypes.object.isRequired,
  tor: PropTypes.object.isRequired,
  setUrl: PropTypes.func.isRequired,
  checkTor: PropTypes.func.isRequired,
  setEnabled: PropTypes.func.isRequired,
  createZcashNode: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired
}
export default withStyles(styles)(Tor)
