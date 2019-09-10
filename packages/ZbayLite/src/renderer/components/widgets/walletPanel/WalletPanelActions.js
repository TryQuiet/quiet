import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  button: {
    width: 150,
    heigth: 80,
    paddingTop: theme.spacing(0.6),
    paddingBottom: theme.spacing(0.6),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: 'rgb(0,0,0,0.6)',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'rgb(0,0,0,0.9)'
    }
  }
})

export const WalletPanelActions = ({ classes, onSend, onReceive }) => (
  <Grid container direction='row' justify='space-between'>
    <Grid item>
      <Button variant='contained' className={classes.button} onClick={onSend}>
        Send Money
      </Button>
    </Grid>
    <Grid item>
      <Button variant='contained' className={classes.button} onClick={onReceive}>
        Receive Money
      </Button>
    </Grid>
  </Grid>
)

WalletPanelActions.propTypes = {
  onSend: PropTypes.func.isRequired,
  onReceive: PropTypes.func.isRequired
}

export default R.compose(
  withStyles(styles),
  React.memo
)(WalletPanelActions)
