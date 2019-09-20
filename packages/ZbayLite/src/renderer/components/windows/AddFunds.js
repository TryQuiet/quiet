import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import { Button } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Icon from '../ui/Icon'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const styles = theme => ({
  gridRoot: {
    width: '100vw',
    minHeight: '100vh'
  },
  paper: {
    width: '100%',
    padding: 0
  },
  welcome: {
    width: '100%',
    height: '100vh'
  },
  button: {
    maxWidth: 286,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  buttonSkip: {
    maxWidth: 286,
    height: 60,
    backgroundColor: theme.palette.colors.white,
    color: theme.palette.colors.lushSky,
    '&:hover': {
      backgroundColor: theme.palette.colors.white
    }
  },
  logoContainer: {
    height: 130
  },
  title: {
    textAlign: 'center',
    width: '100%',
    fontSize: 24,
    height: 36
  },
  caption: {
    textAlign: 'center',
    width: '100%',
    fontSize: 14,
    color: theme.palette.colors.darkGray
  },
  icon: {
    width: 285,
    height: 67
  },
  buttons: {
    marginTop: theme.spacing(4)
  }
})

export const AddFunds = ({ classes, openModal, skip }) => {
  return (
    <WindowWrapper>
      <Grid container className={classes.gridRoot}>
        <Paper className={classes.paper}>
          <Grid
            container
            direction='row'
            justify='center'
            alignContent='center'
            wrap='wrap'
            className={classes.welcome}
          >
            <Grid
              className={classes.logoContainer}
              container
              item
              xs={12}
              justify='center'
              alignItems='center'
            >
              <Icon className={classes.icon} src={icon} />
            </Grid>
            <Grid container item xs={12} wrap='wrap' justify='center'>
              <Typography className={classes.title} variant='h4' gutterBottom>
                Add funds to your wallet
              </Typography>
              <Typography className={classes.caption} variant='body1' align='justify' gutterBottom>
                Before you go into the app you can deposit money to your account
              </Typography>
            </Grid>
            <Grid
              item
              container
              direction='column'
              xs={12}
              justify='center'
              alignItems='center'
              className={classes.buttons}
            >
              <Button
                className={classes.button}
                variant='contained'
                size='large'
                color='primary'
                margin='normal'
                onClick={openModal}
                fullWidth
              >
                Add funds now
              </Button>
              <Button
                className={classes.buttonSkip}
                variant='contained'
                size='large'
                color='primary'
                margin='normal'
                onClick={() => skip(false)}
                fullWidth
              >
                I'll do this later
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </WindowWrapper>
  )
}

AddFunds.propTypes = {
  classes: PropTypes.object.isRequired,
  skip: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired
}
export default withStyles(styles)(AddFunds)
