import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import MaterialModal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import ClearIcon from '@mui/icons-material/Clear'
import BackIcon from '@mui/icons-material/ArrowBack'

import IconButton from '../Icon/IconButton'

import { IModalProps } from './Modal.d'

const PREFIX = 'Modal'

const classes = {
  root: `${PREFIX}root`,
  windowed: `${PREFIX}windowed`,
  title: `${PREFIX}title`,
  header: `${PREFIX}header`,
  headerBorder: `${PREFIX}headerBorder`,
  actions: `${PREFIX}actions`,
  content: `${PREFIX}content`,
  fullPage: `${PREFIX}fullPage`,
  notFullPage: `${PREFIX}notFullPage`,
  centered: `${PREFIX}centered`,
  window: `${PREFIX}window`,
  bold: `${PREFIX}bold`,
  none: `${PREFIX}none`,
  transparent: `${PREFIX}transparent`,
  withoutHeader: `${PREFIX}withoutHeader`
}

const StyledMaterialModal = styled(MaterialModal)(({ theme }) => ({
  [`& .${classes.root}`]: {
    padding: '0 15%'
  },

  [`& .${classes.windowed}`]: {
    height: '30vh',
    width: '50vw',
    position: 'fixed',
    marginTop: '25vh',
    marginLeft: '25vw'
  },

  [`& .${classes.title}`]: {
    fontSize: 15,
    color: theme.palette.colors.trueBlack,
    lineHeight: '18px',
    fontStyle: 'normal',
    fontWeight: 'normal'
  },

  [`& .${classes.header}`]: {
    background: theme.palette.colors.white,
    height: constants.headerHeight
  },

  [`& .${classes.headerBorder}`]: {
    borderBottom: `1px solid ${theme.palette.colors.contentGray}`
  },

  [`& .${classes.actions}`]: {
    paddingLeft: 10,
    paddingRight: 10
  },

  [`& .${classes.content}`]: {
    background: theme.palette.colors.white
  },

  [`& .${classes.fullPage}`]: {
    width: '100%',
    height: `calc(100vh - ${constants.headerHeight}px)`
  },

  [`& .${classes.withoutHeader}`]: {
    width: '100%',
    height: '100vh'
  },

  [`& .${classes.notFullPage}`]: {
    height: '100%',
    width: '100%'
  },

  [`& .${classes.centered}`]: {
    background: theme.palette.colors.white,
    width: '100vw',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    outline: 0
  },

  [`& .${classes.window}`]: {},

  [`& .${classes.bold}`]: {
    fontSize: 16,
    lineHeight: '26px',
    fontWeight: 500
  },
  [`& .${classes.none}`]: {
    display: 'none'
  },
  [`& .${classes.transparent}`]: {
    backgroundColor: 'transparent'
  }
}))

const constants = {
  headerHeight: 60
}

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
  fullPage = true,
  isTransparent = false
}) => {
  return (
    <StyledMaterialModal
      open={open}
      onClose={handleClose}
      className={classNames({
        [classes.windowed]: windowed,
        [classes.root]: !windowed,
        [classes.transparent]: isTransparent
      })}>
      <Grid
        container
        direction='column'
        justifyContent='center'
        className={classNames({
          [classes.centered]: fullPage,
          [classes.window]: !fullPage,
          [classes.transparent]: isTransparent
        })}>
        <Grid
          container
          item
          className={classNames({
            [classes.header]: true,
            [classes.headerBorder]: addBorder,
            [classes.none]: isTransparent
          })}
          direction='row'
          alignItems='center'>
          <Grid
            item
            xs
            container
            direction={alignCloseLeft ? 'row-reverse' : 'row'}
            justifyContent='center'
            alignItems='center'>
            <Grid item xs>
              <Typography
                variant='subtitle1'
                className={classNames({
                  [classes.title]: true,
                  [classes.bold]: isBold
                })}
                style={alignCloseLeft ? { marginRight: 36 } : { marginLeft: 36 }}
                align='center'>
                {title}
              </Typography>
            </Grid>
            <Grid item>
              <Grid
                container
                item
                justifyContent={alignCloseLeft ? 'flex-start' : 'flex-end'}
                className={classes.actions}
                data-testid={`${testIdPrefix}ModalActions`}>
                {canGoBack ? (
                  <IconButton
                    onClick={() => {
                      if (setStep && step) {
                        return setStep(step - 1)
                      }
                    }}>
                    <BackIcon />
                  </IconButton>
                ) : (
                  !isCloseDisabled && (
                    <IconButton
                      onClick={() => {
                        if (handleClose) {
                          return handleClose({}, 'backdropClick')
                        }
                      }}>
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
          justifyContent={'center'}
          className={classNames({
            [classes.fullPage]: fullPage,
            [classes.notFullPage]: !fullPage,
            [classes.withoutHeader]: isTransparent,
            [classes.transparent]: isTransparent
          })}>
          <Grid
            container
            item
            className={classNames({
              [classes.content]: true,
              [classes.transparent]: isTransparent
            })}
            style={{ width: contentWidth, height: contentHeight }}>
            {children}
          </Grid>
        </Grid>
      </Grid>
    </StyledMaterialModal>
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
