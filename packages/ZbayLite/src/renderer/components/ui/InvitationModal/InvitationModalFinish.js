import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Button, Typography } from '@material-ui/core'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import EmailIcon from '@material-ui/icons/Email'

import InvitationModal from './InvitationModal'
const styles = theme => ({
  linkDiv: {
    marginTop: theme.spacing(3.5),
    borderStyle: 'solid',
    borderWidth: 2
  },
  buttonDiv: {
    marginTop: theme.spacing(2)
  },
  button: {
    height: 60,
    width: 350,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  icon: {
    marginRight: theme.spacing(1)
  }
})

export const InvitationModalFinish = ({ classes, open, handleClose, amount, setStep, reset }) => (
  <InvitationModal
    open={open}
    handleClose={() => {
      handleClose()
      setStep(0)
      reset()
    }}
    title={`Here's your invitation!`}
    info={
      amount !== 0
        ? `It has $${amount} attached, so don't lose it! You can share it however you like,
     but don't share large amounts by email or other insecure means.
     Note: it will take a few minutes for funds to become available.`
        : ``
    }
  >
    <Grid item className={classes.linkDiv}>
      <Typography variant='body1'>
        {amount !== 0
          ? `I just sent you $${amount} on Zbay! To claim it, install Zbay from https://zbay.io, run it,
        and then open this link : HERE IS A LINK`
          : `You should try Zbay! Install Zbay from https://zbay.io, run it,
        and then open this link : HERE IS A LINK `}
      </Typography>
    </Grid>
    <Grid item className={classes.buttonDiv}>
      <CopyToClipboard text={'LINK'}>
        <Button
          variant='contained'
          size='large'
          color='primary'
          type='submit'
          className={classes.button}
          onClick={() => {}}
        >
          <FileCopyIcon className={classes.icon} />
          Copy to clipboard
        </Button>
      </CopyToClipboard>
    </Grid>
    <Grid item className={classes.buttonDiv}>
      <Button
        variant='contained'
        size='large'
        color='primary'
        type='submit'
        onClick={() => {}}
        className={classes.button}
      >
        <EmailIcon className={classes.icon} />
        Share with email
      </Button>
    </Grid>
  </InvitationModal>
)

InvitationModalFinish.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModalFinish)
