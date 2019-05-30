import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'

export const ChannelMessageActions = ({
  status,
  fromYou,
  onResend,
  onCancel
}) => (
  <Grid container direction='row' justify='flex-end' alignItems='center'>
    {
      ['failed', 'cancelled'].includes(status) && fromYou
        ? (
          <React.Fragment>
            <Grid item>
              <Button
                size='small'
                color='primary'
                onClick={onResend}
              >
                resend
              </Button>
            </Grid>
            <Grid item>
              <Button
                size='small'
                color='primary'
                onClick={onCancel}
              >
                cancel
              </Button>
            </Grid>
          </React.Fragment>
        )
        : null
    }
  </Grid>
)

ChannelMessageActions.propTypes = {
  status: PropTypes.oneOf(['cancelled', 'pending', 'success', 'failed', 'broadcasted']).isRequired,
  onResend: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  fromYou: PropTypes.bool
}

export default R.compose(
  React.memo
)(ChannelMessageActions)
