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
    fontSize: '0.9rem',
    lineHeight: '1.66'
  },
  header: {
    background: '#fff',
    height: constants.headerHeight,
    order: -1,
    borderBottom: 'solid #cbcbcb 2px'
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
    maxWidth: 680,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    outline: 0
  }
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
      className={classNames({
        [classes.centered]: !fullPage
      })}
    >
      <Grid container item className={classes.header} direction='row' alignItems='center'>
        <Grid item xs className={classes.actions}>
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
        <Grid item xs>
          <Typography variant='subtitle1' className={classes.title} align='center'>
            {title}
          </Typography>
        </Grid>
        <Grid item xs />
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
