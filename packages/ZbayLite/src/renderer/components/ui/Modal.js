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
    marginLeft: 36,
    fontSize: 15,
    color: theme.palette.colors.trueBlack,
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal'
  },
  header: {
    background: theme.palette.colors.white,
    height: constants.headerHeight
  },
  headerBorder: {
    borderBottom: `1px solid ${theme.palette.colors.contentGray}`
  },
  actions: {
    paddingRight: theme.spacing(2)
  },
  content: {
    background: theme.palette.colors.white,
    width: 600
  },
  fullPage: {
    width: '100%',
    height: `calc(100vh - ${constants.headerHeight}px)`
  },
  centered: {
    background: theme.palette.colors.white,
    width: '100vw',
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
  children,
  addBorder
}) => (
  <MaterialModal open={open} onClose={handleClose} className={classes.root}>
    <Grid
      container
      direction='column'
      justify='center'
      className={classNames({
        [classes.centered]: true,
        [classes.window]: true
      })}
    >
      <Grid container item className={classNames({
        [classes.header]: true,
        [classes.headerBorder]: addBorder
      })} direction='row' alignItems='center'>
        <Grid item xs container justify='center' alignItems='center'>
          <Typography variant='subtitle1' className={classes.title} align='center'>
            {title}
          </Typography>
        </Grid>
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
      </Grid>
      <Grid container item direction={'row'} justify={'center'} className={classes.fullPage}>
        <Grid container item className={classes.content}>
          {children}
        </Grid>
      </Grid>
    </Grid>
  </MaterialModal>
)

Modal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string,
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
