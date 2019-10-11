import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Typography, TextField, FormControlLabel, Checkbox } from '@material-ui/core'
import LoadingButton from '../LoadingButton'
import InvitationModal from './InvitationModal'

const styles = theme => ({
  warrning: {
    marginTop: theme.spacing(1)
  },
  warrningText: {
    maxWidth: 400
  },
  inputDiv: {
    width: 45,
    '& input': {
      textAlign: 'center',
      fontSize: '1.25rem',
      fontWeight: 500,
      paddingTop: 4,
      paddingBottom: 3,
      paddingLeft: 5,
      paddingRight: 0
    }
  },
  amountDiv: {
    marginTop: theme.spacing(1)
  },
  zecAmount: {
    marginTop: theme.spacing(1)
  },
  checkboxDiv: {
    maxWidth: 450,
    marginTop: theme.spacing(1),
    '& span': {
      fontSize: '0.8rem'
    }
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
  checkboxRoot: {
    color: theme.palette.colors.zbayBlue,
    '&$checked': {
      color: theme.palette.colors.zbayBlue
    }
  },
  checked: {}
})

export const InvitationModalGenerate = ({
  classes,
  open,
  handleClose,
  zecRate,
  amount,
  includeAffiliate,
  affiliate,
  generateInvitation,
  setAmount,
  setStep,
  isLoading,
  setLoading
}) => (
  <InvitationModal
    open={open}
    handleClose={handleClose}
    title={`Invite a friend`}
    info={`Invite friends to Zbay and (optionally)
     give them
  some funds to get started`}
  >
    <Grid item className={classes.warrning}>
      <Typography variant='body2' className={classes.warrningText}>
        ( This will generate a special invite link you can share with a friend. Once your friend
        installs Zbay they can open it to reclaim funds. You can use it to reclaim the funds
        yourself too - just dont't lose the link! )
      </Typography>
    </Grid>
    <Grid container justify='center' align='center' className={classes.amountDiv}>
      <Grid item>
        <Typography variant='h6'>$ </Typography>
      </Grid>
      <Grid item>
        <TextField
          classes={{
            input: classes.input
          }}
          className={classes.inputDiv}
          type='number'
          value={amount}
          InputProps={{ inputProps: { min: 0, max: 99 } }}
          onChange={e => setAmount(e.target.value)}
        />
      </Grid>
      <Grid item>
        <Typography variant='h6'> USD</Typography>
      </Grid>
    </Grid>
    <Grid item className={classes.zecAmount}>
      <Typography variant='body2'>{(amount / zecRate).toFixed(4)} ZEC</Typography>
    </Grid>
    <Grid item>
      <FormControlLabel
        control={
          <Checkbox
            checked={affiliate}
            onChange={e => {
              includeAffiliate(e.target.checked)
            }}
            classes={{ root: classes.checkboxRoot, checked: classes.checked }}
          />
        }
        className={classes.checkboxDiv}
        label={`Include your affiliate code, so that you'll earn 1% of their purchases. (They can disable this at any time.)`}
      />
    </Grid>
    <Grid item className={classes.buttonDiv}>
      <LoadingButton
        variant='contained'
        size='large'
        color='primary'
        type='submit'
        fullWidth
        inProgress={isLoading}
        className={classes.button}
        onClick={async () => {
          setLoading(true)
          await generateInvitation(1)
          setStep(1)
          setLoading(false)
        }}
      >
        Generate invitation
      </LoadingButton>
    </Grid>
  </InvitationModal>
)

InvitationModalGenerate.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  zecRate: PropTypes.number.isRequired,
  amount: PropTypes.number.isRequired,
  includeAffiliate: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  affiliate: PropTypes.bool.isRequired,
  setAmount: PropTypes.func.isRequired,
  generateInvitation: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired,
  isLoading: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModalGenerate)
