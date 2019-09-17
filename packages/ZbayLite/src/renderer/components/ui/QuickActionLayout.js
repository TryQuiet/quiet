import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ClearIcon from '@material-ui/icons/Clear'
import IconButton from './IconButton'

const styles = theme => ({
  alignAvatarPopover: {
    marginTop: theme.spacing(2)
  },
  button: {
    marginTop: theme.spacing(3),
    width: 260,
    height: 60,
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.purple,
    textTransform: 'none'
  },
  container: {
    height: 400,
    width: 320
  },
  usernamePopover: {
    marginTop: theme.spacing(1),
    fontSize: '1.2rem',
    fontWeight: '600'
  },
  closeIcon: {
    margin: theme.spacing(2)
  },
  info: {
    color: theme.palette.colors.zbayBlue
  },
  infoDiv: {
    textAlign: 'center',
    marginTop: theme.spacing(1.2),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4)
  },
  avatar: {
    marginTop: theme.spacing(2)
  }
})

export const QuickActionLayout = ({
  classes,
  main,
  children,
  info,
  handleClose,
  buttonName,
  onClick,
  warrning
}) => {
  return (
    <Grid
      container
      className={classes.container}
      direction='column'
      justify='flex-start'
      alignItems='center'
    >
      <Grid className={classes.icon} container item direction='row' justify='flex-start'>
        <IconButton className={classes.closeIcon} onClick={handleClose}>
          <ClearIcon />
        </IconButton>
      </Grid>
      <Grid item className={classes.avatar}>
        <span className={classes.alignAvatarPopover}>{children}</span>
      </Grid>
      <Grid item>
        <Typography color='textPrimary' className={classes.usernamePopover}>
          {main}
        </Typography>
      </Grid>
      <Grid item>
        <Typography className={classes.info} variant='caption'>
          {info}
        </Typography>
      </Grid>
      <Grid item>
        <Button
          variant={'contained'}
          onClick={onClick}
          disabled={!!warrning}
          className={classes.button}
        >
          {buttonName}
        </Button>
      </Grid>
      <Grid item className={classes.infoDiv} >
        <Typography className={classes.info} variant='caption'>
          {warrning}
        </Typography>
      </Grid>
    </Grid>
  )
}

QuickActionLayout.propTypes = {
  classes: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  main: PropTypes.string.isRequired,
  info: PropTypes.string.isRequired,
  buttonName: PropTypes.string,
  warrning: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(QuickActionLayout)
