import React from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'
// import classNames from 'classnames'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import { withStyles } from '@material-ui/core/styles'
import { shell } from 'electron'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import CloseIcon from '@material-ui/icons/Close'
import Dialog from '@material-ui/core/Dialog'

import Icon from '../../ui/Icon'
import qrIcon from '../../../../renderer/static/images/qr.svg'
import buyIcon from '../../../../renderer/static/images/buy-zcash.svg'
import Tooltip from '../../ui/Tooltip'

const styles = theme => ({
  spacing24: {
    marginTop: 24
  },
  spacing16: {
    marginTop: 16
  },
  spacing32: {
    marginTop: 32
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  },
  subtitle: {
    fontWeight: 500,
    color: theme.palette.colors.black30
  },
  caption: {
    color: theme.palette.colors.darkGray,
    lineHeight: '18px'
  },
  transparentAddress: {
    color: theme.palette.colors.darkGray,
    height: 60
  },
  qrIcon: {
    padding: 18,
    border: `1px solid rgba(0, 0, 0, 0.26)`,
    borderRadius: 4,
    width: 60,
    height: 60,
    paddingBottom: 0,
    marginLeft: 8,
    cursor: 'pointer'
  },
  button: {
    marginTop: 16,
    height: 60,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  infoDiv: {
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 32,
    paddingTop: 16,
    paddingBottom: 16,
    '&:hover': {
      backgroundColor: theme.palette.colors.veryLightGray
    }
  },
  iconDiv: {
    marginRight: 16,
    marginTop: 4
  },
  privateTitle: {
    color: theme.palette.colors.lushSky
  },
  privateDiv: {
    minHeight: 56,
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 32,
    padding: 16
  },
  icon: {
    color: theme.palette.colors.lushSky
  },
  tooltip: {
    zIndex: 1500
  },
  qrcodeDiv: {
    marginTop: 24,
    marginBottom: 65
  },
  dialogContent: {
    paddingLeft: 32,
    paddingRight: 32
  },
  alignText: {
    textAlign: 'center'
  },
  buttonCopied: {
    color: theme.palette.colors.zbayBlue,
    backgroundColor: theme.palette.colors.white,
    marginTop: 16,
    height: 60,
    fontSize: '0.9rem',
    border: `1px solid ${theme.palette.colors.zbayBlue}`,
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.colors.buttonGray
    }
  }
})

export const AddFunds = ({
  classes,
  variant,
  transparentAddress,
  privateAddress,
  setCurrentTab
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  return (
    <>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <Grid container direction='column'>
          <Grid item>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid
            container
            direction='column'
            alignItems='center'
            className={classes.dialogContent}
          >
            <Grid item className={classes.spacing24}>
              <Typography variant='h3'>Add funds with QR code</Typography>
            </Grid>
            <Grid item className={classes.spacing24}>
              <Typography variant='body2' className={classes.alignText}>
                If you have Zcash on your phone or your friend's phone, you can
                send funds to your Zcash address using this QR code.
              </Typography>
            </Grid>
            <Grid item className={classes.qrcodeDiv}>
              <QRCode value={transparentAddress} size={200} />
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
      <Grid
        container
        item
        justify={variant === 'wide' ? 'center' : 'flex-start'}
      >
        <Typography variant={'h3'} className={classes.tabTitle}>
          Add funds to your wallet
        </Typography>
      </Grid>
      <Grid item className={classes.spacing24}>
        <Typography variant='body2'>
          Zbay runs on{' '}
          <a
            className={classes.link}
            onClick={e => {
              e.preventDefault()
              shell.openExternal('https://z.cash/')
            }}
            href='https://z.cash/'
          >
            Zcash
          </a>{' '}
          (a cryptocurrency). Cryptocurrency addresses are unique, like email
          addressess or phone numbers, for money (send to the right address and
          the recipient will get the money).
        </Typography>
      </Grid>
      <Grid item className={classes.spacing32}>
        <Typography variant='body2' className={classes.subtitle}>
          Your Zcash address
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='caption' className={classes.caption}>
          Send Zcash to it, and Zbay will store the funds on your computer.
        </Typography>
      </Grid>
      <Grid item className={classes.spacing16}>
        <Grid container>
          <Grid item xs>
            <OutlinedInput
              name='address'
              id='outlined-address'
              classes={{ root: classes.transparentAddress }}
              value={transparentAddress}
              fullWidth
              disabled
            />
          </Grid>
          <Tooltip
            title='Send to Zbay with QR code'
            className={classes.tooltip}
            placement='top-end'
          >
            <Grid
              item
              className={classes.qrIcon}
              onClick={() => {
                setDialogOpen(true)
              }}
            >
              <Icon src={qrIcon} />
            </Grid>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid item xs>
        <CopyToClipboard
          text={transparentAddress}
          onCopy={() => {
            setIsCopied(true)
          }}
        >
          <Button
            variant='contained'
            size='large'
            color='primary'
            type='submit'
            fullWidth
            className={isCopied ? classes.buttonCopied : classes.button}
          >
            {isCopied
              ? `Address copied to clipboard`
              : `Copy address to clipboard`}
          </Button>
        </CopyToClipboard>
      </Grid>
      <Grid
        item
        className={classes.infoDiv}
        onClick={() => {
          setCurrentTab('buyZcash')
        }}
      >
        <Grid container alignItems='center' justify='center'>
          <Grid item className={classes.iconDiv}>
            <Icon src={buyIcon} />
          </Grid>
          <Grid item>
            <Typography variant='h4'>How do i buy Zcash? </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid
        item
        className={classes.privateDiv}
        onClick={() => {
          setExpanded(!expanded)
        }}
      >
        <Grid container alignItems='center' justify='space-between'>
          <Grid item>
            <Typography variant='body2' className={classes.privateTitle}>
              Private address
            </Typography>
          </Grid>
          {expanded ? (
            <ExpandLessIcon className={classes.icon} />
          ) : (
            <ExpandMoreIcon className={classes.icon} />
          )}
        </Grid>
        {expanded && (
          <Grid container className={classes.spacing24}>
            <Grid item>
              <Typography variant='body2' className={classes.subtitle}>
                Your private Zcash address
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='caption' className={classes.caption}>
                You can't send directly to this address from most exchanges.
                Zbay will move your funds to a private address as soon as it
                arrives.
              </Typography>
            </Grid>
            <Grid item xs className={classes.spacing24}>
              <OutlinedInput
                name='address'
                id='outlined-address'
                classes={{ root: classes.transparentAddress }}
                value={privateAddress}
                fullWidth
                disabled
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  )
}

AddFunds.propTypes = {
  classes: PropTypes.object.isRequired,
  transparentAddress: PropTypes.string.isRequired,
  privateAddress: PropTypes.string.isRequired,
  variant: PropTypes.string,
  setCurrentTab: PropTypes.func.isRequired
}

AddFunds.defaultProps = {}

export default withStyles(styles)(AddFunds)
