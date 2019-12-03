import React from 'react'
import PropTypes from 'prop-types'
import { shell } from 'electron'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import 'react-alice-carousel/lib/alice-carousel.css'
import InputAdornment from '@material-ui/core/InputAdornment'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import IconButton from '@material-ui/core/IconButton'
import RefreshIcon from '@material-ui/icons/Refresh'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  message: {
    color: theme.palette.colors.darkGray,
    fontSize: 16
  },
  error: {
    marginTop: 8,
    color: theme.palette.colors.red
  },
  addressDiv: {
    width: 286,
    marginTop: -8
  }
})

export const Tor = ({
  classes,
  checkDeafult,
  tor,
  setUrl,
  setEnabled,
  checkTor
}) => (
  <Grid className={classes.root} container direction='column' alignItems='center'>
    <Grid className={classes.checkbox} item>
      <FormControlLabel
        control={
          <Checkbox
            checked={tor.enabled}
            onChange={e => {
              setEnabled({ enabled: e.target.checked })
              if (e.target.checked) {
                checkDeafult()
              }
            }}
            color='default'
          />
        }
        label={<Typography variant='body2'>Connect through Tor (optional)</Typography>}
      />
    </Grid>
    {tor.enabled && (
      <Grid
        className={classes.addressDiv}
        container
        direction='column'
        justify='center'
        alignItems='center'
        item
      >
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
            InputProps={{
              // TODO: Should be removed after migrating to material v4.0
              className: classes.borderBox,
              endAdornment: (
                <InputAdornment position='end' style={{ padding: 0 }}>
                  <IconButton
                    className={classes.refresh}
                    onClick={checkTor}
                    disabled={tor.enabled === false}
                  >
                    <RefreshIcon fontSize='large' />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            Using Tor?{' '}
            <a
              onClick={e => {
                e.preventDefault()
                shell.openExternal('https://zcash.readthedocs.io/en/latest/rtd_pages/tor.html')
              }}
              href='#'
            >
              Read this warning
            </a>
          </Typography>
        </Grid>
      </Grid>
    )}

    {tor.error && (
      <Grid item className={classes.error}>
        <Typography variant='body2'>{tor.error}</Typography>
      </Grid>
    )}
  </Grid>
)

Tor.propTypes = {
  classes: PropTypes.object.isRequired,
  tor: PropTypes.object.isRequired,
  setUrl: PropTypes.func.isRequired,
  checkTor: PropTypes.func.isRequired,
  setEnabled: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired
}
export default withStyles(styles)(Tor)
