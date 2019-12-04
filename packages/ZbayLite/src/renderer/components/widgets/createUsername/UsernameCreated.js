import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import Icon from '../../ui/Icon'
import usernameIcon from '../../../static/images/username.svg'

const styles = theme => ({
  root: {},
  usernameConatainer: {
    marginTop: 24
  },
  infoConatainer: {
    marginTop: 24
  },
  descConatainer: {
    marginTop: 8
  },
  usernameIcon: {
    width: 118,
    height: 118,
    justifyContent: 'center'
  },
  buttonContainer: {
    marginTop: 23,
    paddingBottom: 63
  },
  button: {
    width: 124,
    height: 59,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray
    }
  }
})

const handleModalClose = (handleClose, setFormSent) => {
  setFormSent(false)
  handleClose()
}

export const UsernameCreated = ({ classes, handleClose, setFormSent }) => (
  <Grid container justify={'center'}>
    <Grid
      container
      className={classes.usernameConatainer}
      item
      xs={12}
      direction='row'
      justify='center'
    >
      <Icon className={classes.usernameIcon} src={usernameIcon} />
    </Grid>
    <Grid
      container
      item
      className={classes.infoConatainer}
      xs={12}
      direction='row'
      justify='center'
    >
      <Typography variant={'h4'}>You created a username</Typography>
    </Grid>
    <Grid
      container
      item
      className={classes.descConatainer}
      xs={12}
      direction='row'
      justify='center'
    >
      <Typography variant={'body2'}>Your username will be be registered shortly.</Typography>
    </Grid>
    <Grid item xs={'auto'} className={classes.buttonContainer}>
      <Button
        variant='contained'
        onClick={() => handleModalClose(handleClose, setFormSent)}
        size='small'
        fullWidth
        className={classes.button}
      >
        Done
      </Button>
    </Grid>
  </Grid>
)

UsernameCreated.propTypes = {
  classes: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  setFormSent: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(UsernameCreated)
