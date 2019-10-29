import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import MaterialModal from '@material-ui/core/Modal'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ClearIcon from '@material-ui/icons/Clear'
import BackIcon from '@material-ui/icons/ArrowBack'

import IconButton from './IconButton'

const constants = {
  headerHeight: 60
}

const styles = theme => ({
  root: {
    padding: '0 15%'
  },
  title: {
    marginLeft: -36,
    fontSize: 15,
    color: theme.palette.colors.trueBlack,
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal'
  },
  header: {
    background: '#fff',
    height: constants.headerHeight,
    order: -1
  },
  actions: {
    paddingLeft: theme.spacing(2)
  },
  content: {
    background: '#fff'
  },
  fullPage: {
    height: `calc(100vh - ${constants.headerHeight}px)`
  },
  centered: {
    maxWidth: 570,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    outline: 0
  },
  window: {}
})

export const Modal = ({
  classes,
  open,
  handleClose,
  title,
  fullPage,
  canGoBack,
  step,
  setStep,
  children
}) => (
  <MaterialModal open={open} onClose={handleClose} className={classes.root}>
    <Grid
      container
      direction='column'
      justify='center'
      className={classNames({
        [classes.centered]: !fullPage,
        [classes.window]: true
      })}
    >
      <Grid container item className={classes.header} direction='row' alignItems='center'>
        <Grid item className={classes.actions}>
          {canGoBack ? (
            <IconButton onClick={() => setStep(step - 1)}>
              <BackIcon />
            </IconButton>
          ) : (
            <IconButton onClick={handleClose}>
              <ClearIcon />
            </IconButton>
          )}
        </Grid>
        <Grid item xs container justify='center' alignItems='center'>
          <Typography variant='subtitle1' className={classes.title} align='center'>
            {title}
          </Typography>
        </Grid>
      </Grid>
      <Grid
        container
        item
        className={classNames({
          [classes.content]: true,
          [classes.fullPage]: fullPage
        })}
      >
        {children}
      </Grid>
    </Grid>
  </MaterialModal>
)

Modal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  fullPage: PropTypes.bool.isRequired,
  step: PropTypes.number,
  setStep: PropTypes.func,
  canGoBack: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element), PropTypes.element])
    .isRequired
}

Modal.defaultProps = {
  fullPage: false,
  canGoBack: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Modal)
