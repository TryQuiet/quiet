import React from 'react'
import PropTypes from 'prop-types'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'

const styles = theme => ({
  root: {
    marginTop: -60,
    backgroundColor: theme.palette.colors.white,
    border: 'none'
  },
  button: {
    marginTop: 20,
    height: 70,
    width: 300,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    width: 300,
    marginLeft: 2,
    fontSize: '14px',
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  title: {
    marginBottom: 16
  },
  bold: {
    fontWeight: 'bold'
  },
  text: {
    textAlign: 'justify',
    textAlignLast: 'center'
  }
})

export const BlockchainLocationModal = ({ classes, open, handleSelection }) => {
  return (
    <Modal open={open} isCloseDisabled>
      <Grid container direction='column' className={classes.root} alignContent='center' justify='center'>
        <Grid container item justify='center'>
          <Grid item className={classes.title}>
            <Typography variant='h3'>Use existing Zcash install?</Typography>
          </Grid>
        </Grid>
        <Grid container item justify='center'>
          <Grid item>
            <Typography variant='body2' className={classes.text}>Oh awesome! It looks like you may have already installed Zcash. Zbay includes Zcash but we can use your existing Zcash instead -
              <span className={classes.bold}> IF it's a full node (not a light wallet) with default settings. </span>Not sure? Use ours! It should sync quickly.
            </Typography>
          </Grid>
        </Grid>
        <Grid container justify='center' alignItems={'flex-start'}>
          <Grid item container justify={'center'} xs={12}>
            <Button
              variant='contained'
              size='large'
              color='primary'
              type='submit'
              onClick={() => handleSelection('DOWNLOAD_NEW')}
              fullWidth
              className={classes.button}
            >
        Install Zcash again (recommended)
            </Button>
          </Grid>
          <Grid item container justify={'center'} xs={12}>
            <Typography className={classes.link} variant={'caption'} onClick={() => handleSelection('EXISTING')}>{`Use my existing Zcash install (advanced)`}</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  )
}

BlockchainLocationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleSelection: PropTypes.func.isRequired
}

export default withStyles(styles)(BlockchainLocationModal)
