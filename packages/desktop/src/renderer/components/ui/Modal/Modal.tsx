
import React from 'react'
import classNames from 'classnames'

import MaterialModal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'

import ClearIcon from '@mui/icons-material/Clear'
import BackIcon from '@mui/icons-material/ArrowBack'

import IconButton from '../Icon/IconButton'

import { IModalProps } from './Modal.d'

const constants = {
  headerHeight: 60
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '0 15%'
  },
  windowed: {
    height: '30vh',
    width: '50vw',
    position: 'fixed',
    marginTop: '25vh',
    marginLeft: '25vw'
  },
  title: {
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
    paddingLeft: 10,
    paddingRight: 10
  },
  content: {
    background: theme.palette.colors.white
  },
  fullPage: {
    width: '100%',
    height: `calc(100vh - ${constants.headerHeight}px)`
  },
  notFullPage: {
    height: '100%',
    width: '100%'
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
  window: {},
  bold: {
    fontSize: 16,
    lineHeight: '26px',
    fontWeight: 500
  }
}))

export const Modal: React.FC<IModalProps> = ({
  open,
  handleClose,
  title,
  canGoBack,
  isBold,
  step,
  setStep,
  contentWidth,
  contentHeight,
  isCloseDisabled,
  alignCloseLeft,
  addBorder,
  children,
  testIdPrefix = '',
  windowed,
  fullPage = true
}) => {
  const classes = useStyles({})

  return (
    <MaterialModal open={open} onClose={handleClose} className={windowed ? classes.windowed : classes.root}
    >
      <Grid
        container
        direction="column"
        justify="center"
        className={classNames({
          [classes.centered]: fullPage,
          [classes.window]: !fullPage
        })}
      >
        <Grid
          container
          item
          className={classNames({
            [classes.header]: true,
            [classes.headerBorder]: addBorder
          })}
          direction="row"
          alignItems="center"
        >
          <Grid
            item
            xs
            container
            direction={alignCloseLeft ? 'row-reverse' : 'row'}
            justify="center"
            alignItems="center"
          >
            <Grid item xs>
              <Typography
                variant="subtitle1"
                className={classNames({
                  [classes.title]: true,
                  [classes.bold]: isBold
                })}
                style={
                  alignCloseLeft ? { marginRight: 36 } : { marginLeft: 36 }
                }
                align="center"
              >
                {title}
              </Typography>
            </Grid>
            <Grid item>
              <Grid
                container
                item
                justify={alignCloseLeft ? 'flex-start' : 'flex-end'}
                className={classes.actions}
                data-testid={`${testIdPrefix}ModalActions`}
              >
                {canGoBack
                  ? (
                    <IconButton onClick={() => {
                      if (setStep && step) { return setStep(step - 1) }
                    }
                    }>
                      <BackIcon />
                    </IconButton>
                  )
                  : (
                    !isCloseDisabled && (
                      <IconButton
                        onClick={() => {
                          if (handleClose) { return handleClose({}, 'backdropClick') }
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    )
                  )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          container
          item
          direction={'row'}
          justify={'center'}
          className={classNames({
            [classes.fullPage]: fullPage,
            [classes.notFullPage]: !fullPage
          })}

        >
          <Grid
            container
            item
            className={classNames({ [classes.content]: true })}
            style={{ width: contentWidth, height: contentHeight }}
          >
            {children}
          </Grid>
        </Grid>
      </Grid>
    </MaterialModal >
  )
}

Modal.defaultProps = {
  canGoBack: false,
  isBold: false,
  alignCloseLeft: false,
  contentWidth: 600,
  isCloseDisabled: false,
  addBorder: false
}

export default Modal
