import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Button, TextField } from '@material-ui/core'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import InvitationModal from './InvitationModal'

const styles = theme => ({
  linkDiv: {
    marginTop: theme.spacing(3.5),
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: theme.palette.colors.inputGray,
    padding: 24
  },
  buttonDiv: {
    marginTop: theme.spacing(2)
  },
  button: {
    height: 60,
    width: '100%',
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  icon: {
    marginRight: theme.spacing(1)
  },
  textfield: {
    backgroundColor: theme.palette.colors.white
  },
  disabled: {
    color: theme.palette.colors.trueBlack
  }
})

export const InvitationModalFinish = ({ classes, amount, generatedInvitation }) => (
  <InvitationModal
    title={`Here’s your invite link`}
    info={
      parseFloat(amount) !== 0
        ? `It has $${amount} attached, so don't lose it! You can share it however you like,
     but don't share large amounts by email or other insecure means.
     Note: it will take a few minutes for funds to become available.`
        : ``
    }
  >
    <Grid item className={classes.linkDiv}>
      <TextField
        id='traceback'
        disabled
        variant='outlined'
        multiline
        fullWidth
        rows={4}
        value={generatedInvitation}
        InputProps={{
          classes: {
            root: classes.textfield,
            disabled: classes.disabled
          }
        }}
      />
      <Grid item container justify='center' alignItems='center' className={classes.buttonDiv}>
        <CopyToClipboard text={generatedInvitation}>
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
    </Grid>
  </InvitationModal>
)

InvitationModalFinish.propTypes = {
  classes: PropTypes.object.isRequired,
  amount: PropTypes.number.isRequired,
  generatedInvitation: PropTypes.string.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModalFinish)
