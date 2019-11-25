import React, { Fragment } from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import MenuItem from '@material-ui/core/MenuItem'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Select from '@material-ui/core/Select'
import { withStyles } from '@material-ui/core/styles'
import { shell } from 'electron'

import Modal from '../Modal'
import IconCopy from '../IconCopy'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  title: {
    paddingBottom: theme.spacing(1)
  },
  select: {
    ...theme.typography.h5,
    padding: '0 24px 0 0'
  },
  selectWrapper: {
    margin: '0 8px',
    borderBottom: 'none'
  },
  shield: {
    marginTop: theme.spacing(2)
  },
  dataRoot: {
    padding: `0 ${theme.spacing(4)}px`
  },
  description: {
    marginBottom: theme.spacing(2)
  },
  copyField: {
    width: 370,
    borderRadius: 4,
    marginBottom: theme.spacing(2)
  },
  copyInput: {
    borderRight: `1px solid`,
    paddingTop: 18,
    paddingBottom: 18
  }
})
const descriptions = {
  transparent: (
    <Fragment>
      You need Zcash (ZEC) to use Zbay. So buy some ZEC at{' '}
      <a
        onClick={e => {
          e.preventDefault()
          shell.openExternal('http://coinbase.com')
        }}
        href='coinbase.com'
      >
        Coinbase.com
      </a>{' '}
      and send it to the address below. Note: Coinbase and most exchanges will not send to a private
      address, but Zbay automatically moves your ZEC to your own private address as soon as it
      arrives.
    </Fragment>
  ),
  private: 'You can use your private address to exchange ZEC with other people.'
}

export const TopUpModal = ({
  classes,
  open,
  type,
  address,
  handleChange,
  handleClose,
  handleCopy
}) => (
  <Modal open={open} handleClose={handleClose} title='Add funds to your wallet' fullPage>
    <Grid container justify='center' alignContent='flex-start' className={classes.root}>
      <Grid item container justify='center' alignItems='flex-start' className={classes.title}>
        <Typography variant='h5'>Add funds to</Typography>
        <Select
          displayEmpty
          name='address'
          value={type}
          onChange={handleChange}
          className={classes.selectWrapper}
          classes={{ select: classes.select }}
        >
          <MenuItem value={'transparent'}>Transparent</MenuItem>
          <MenuItem value={'private'}>Private</MenuItem>
        </Select>
        <Typography variant='h5'>address</Typography>
      </Grid>
      <Grid item>
        <Grid
          container
          direction='column'
          justify='center'
          alignItems='center'
          className={classes.dataRoot}
          spacing={2}
        >
          <Grid item>
            <Typography variant='body2' className={classes.description}>
              {descriptions[type]}
            </Typography>
          </Grid>
          <Grid item>
            <QRCode value={address} size={250} />
          </Grid>
          <Grid item>
            <TextField
              id='copy-address'
              className={classes.copyField}
              variant='outlined'
              type='text'
              value={address}
              disabled
              InputProps={{
                classes: { input: classes.copyInput },
                endAdornment: (
                  <InputAdornment position='end'>
                    <CopyToClipboard text={address} onCopy={handleCopy}>
                      <IconButton>
                        <IconCopy />
                      </IconButton>
                    </CopyToClipboard>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Modal>
)

TopUpModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

TopUpModal.defaultProps = {
  open: false,
  handleCopy: () => null
}

export default withStyles(styles)(TopUpModal)
