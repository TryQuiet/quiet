import React from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import { withStyles } from '@material-ui/core/styles'
import { shell } from 'electron'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import Dialog from '@material-ui/core/Dialog'

import Icon from '../../ui/Icon'
import qrIcon from '../../../../renderer/static/images/qr.svg'
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
    cursor: 'pointer',
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
    border: '1px solid rgba(0, 0, 0, 0.26)',
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
  generateNewAddress,
  generateNewShieldedAddress,
  topAddress,
  topShieldedAddress
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  const [isCopiedPrivate, setIsCopiedPrivate] = React.useState(false)
  const [currentAddress, setCurrentAddress] = React.useState(null)

  const onClickHandle = (address) => {
    setCurrentAddress(address)
    setDialogOpen(true)
  }

  return (
    <>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <Grid container direction='column'>
          <Grid item>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid container direction='column' alignItems='center' className={classes.dialogContent}>
            <Grid item className={classes.spacing24}>
              <Typography variant='h3'>Add funds with QR code</Typography>
            </Grid>
            <Grid item className={classes.spacing24}>
              <Typography variant='body2' className={classes.alignText}>
                If you have Zcash on your phone or your friend's phone, you can send funds to your
                Zcash address using this QR code.
              </Typography>
            </Grid>
            <Grid item className={classes.qrcodeDiv}>
              <QRCode value={currentAddress} size={200} />
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
      <Grid container item justify={variant === 'wide' ? 'center' : 'flex-start'}>
        <Typography variant={'h3'} className={classes.tabTitle}>
          Add funds to your wallet
        </Typography>
      </Grid>
      <Grid item className={classes.spacing24}>
        <Typography variant='body2'>
        Zbay uses the privacy-focused cryptocurrency{' '}
          <a
            className={classes.link}
            onClick={e => {
              e.preventDefault()
              shell.openExternal('https://z.cash/')
            }}
            href='https://z.cash/'>
            Zcash
          </a>
          . Cryptocurrencies let you send funds to unique addresses, like email for money: send to the correct address, and the recipient will receive it. Send Zcash to either of these addresses, and Zbay will store the funds on your computer.
        </Typography>
      </Grid>
      <Grid item className={classes.spacing32}>
        <Typography variant='body2' className={classes.subtitle}>
        Your transparent Zcash address
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='caption' className={classes.caption}>
        Transactions to this address are not private, but Zbay will move deposits to your private address when they arrive.{' '}
          <span className={classes.link} onClick={generateNewAddress}>
            Generate new address
          </span>
        </Typography>
      </Grid>
      <Grid item className={classes.spacing16}>
        <Grid container>
          <Grid item xs>
            <OutlinedInput
              name='address'
              id='outlined-address'
              classes={{ root: classes.transparentAddress }}
              value={topAddress}
              fullWidth
              disabled
            />
          </Grid>
          <Tooltip
            title='Send to Zbay with QR code'
            className={classes.tooltip}
            placement='top-end'>
            <Grid
              item
              className={classes.qrIcon}
              onClick={() => { onClickHandle(topAddress) }}>
              <Icon src={qrIcon} />
            </Grid>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid item xs>
        <CopyToClipboard
          text={topAddress}
          onCopy={() => {
            setIsCopied(true)
          }}>
          <Button
            variant='contained'
            size='large'
            color='primary'
            type='submit'
            className={isCopied ? classes.buttonCopied : classes.button}>
            {isCopied ? 'Address copied to clipboard' : 'Copy address to clipboard'}
          </Button>
        </CopyToClipboard>
      </Grid>
      <Grid item className={classes.spacing32}>
        <Typography variant='body2' className={classes.subtitle}>
        Your private Zcash address
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='caption' className={classes.caption}>You can’t send directly to a private address from most exchanges. If sending from an exchange, use the address above, and Zbay will move all funds to a private address as soon as they arrive.{' '}
          <span className={classes.link} onClick={generateNewShieldedAddress}>
            Generate new address
          </span>
        </Typography>
      </Grid>
      <Grid item className={classes.spacing16}>
        <Grid container>
          <Grid item xs>
            <OutlinedInput
              name='address'
              id='outlined-address'
              classes={{ root: classes.transparentAddress }}
              value={topShieldedAddress}
              fullWidth
              disabled
            />
          </Grid>
          <Tooltip
            title='Send to Zbay with QR code'
            className={classes.tooltip}
            placement='top-end'>
            <Grid
              item
              className={classes.qrIcon}
              onClick={() => { onClickHandle(topShieldedAddress) }}>
              <Icon src={qrIcon} />
            </Grid>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid item xs>
        <CopyToClipboard
          text={topShieldedAddress}
          onCopy={() => {
            setIsCopiedPrivate(true)
          }}>
          <Button
            variant='contained'
            size='large'
            color='primary'
            type='submit'
            className={isCopiedPrivate ? classes.buttonCopied : classes.button}>
            {isCopiedPrivate ? 'Address copied to clipboard' : 'Copy address to clipboard'}
          </Button>
        </CopyToClipboard>
      </Grid>
    </>
  )
}

AddFunds.propTypes = {
  classes: PropTypes.object.isRequired,
  scrollbarRef: PropTypes.object.isRequired,
  topAddress: PropTypes.string.isRequired,
  topShieldedAddress: PropTypes.string.isRequired,
  variant: PropTypes.string,
  setCurrentTab: PropTypes.func.isRequired,
  clearCurrentOpenTab: PropTypes.func.isRequired
}

AddFunds.defaultProps = {}

export default withStyles(styles)(AddFunds)
