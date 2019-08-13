import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'

export const WalletPanelActions = ({ onSend, onReceive }) => (
  <Grid container direction='row' justify='space-between'>
    <Grid item>
      <Button
        variant='contained'
        size='small'
        color='primary'
        onClick={onSend}
      >
        Send Money
      </Button>
    </Grid>
    <Grid item>
      <Button
        variant='contained'
        size='small'
        color='primary'
        onClick={onReceive}
      >
        Receive Money
      </Button>
    </Grid>
  </Grid>
)

WalletPanelActions.propTypes = {
  onSend: PropTypes.func.isRequired,
  onReceive: PropTypes.func.isRequired
}

export default React.memo(WalletPanelActions)
