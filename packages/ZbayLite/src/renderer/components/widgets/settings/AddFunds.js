import React, { Fragment } from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import classNames from 'classnames'

import MenuItem from '@material-ui/core/MenuItem'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Select from '@material-ui/core/Select'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import { withStyles } from '@material-ui/core/styles'
import UnfoldMore from '@material-ui/icons/UnfoldMore'
import IconButton from '@material-ui/core/IconButton'
import { shell } from 'electron'
import Autocomplete from '@material-ui/lab/Autocomplete'

import Icon from '../../ui/Icon'
import CopyIcon from '../../../../renderer/static/images/copylink.svg'

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.colors.white,
    width: 348,
    borderRadius: 4,
    marginTop: 24,
    border: `1px solid ${theme.palette.colors.inputGray}`
  },
  title: {
    paddingBottom: theme.spacing(1)
  },
  select: {},
  selectWrapper: {
    width: 300,
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
    paddingRight: 23,
    width: '100%',
    borderRadius: 4,
    marginBottom: theme.spacing(2)
  },
  copyInput: {
    borderRight: `1px solid ${theme.palette.colors.inputGray}`,
    paddingTop: 18,
    paddingBottom: 18
  },
  fieldTitle: {
    marginTop: 25,
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.black30,
    marginBottom: 6
  },
  infoText: {
    marginTop: 8,
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray
  },
  helperText: {
    marginTop: 24
  },
  addressSelectBox: {
    padding: '0  23px 23px',
    borderBottom: `1px solid ${theme.palette.colors.inputGray}`
  },
  QRCodeBox: {
    width: '100%',
    height: 268,
    backgroundColor: theme.palette.colors.veryLightGray,
    borderBottom: `1px solid ${theme.palette.colors.inputGray}`
  },
  whiteBox: {
    borderRadius: 4,
    borderBottom: `1px solid ${theme.palette.colors.inputGray}`,
    width: 220,
    height: 220,
    backgroundColor: theme.palette.colors.white
  },
  copyInputBox: {
    marginTop: 0,
    paddingLeft: 23
  },
  iconBackground: {
    margin: 0,
    padding: 0
  },
  iconBox: {
    margin: 0,
    padding: 5,
    width: 60,
    height: 56,
    backgroundColor: theme.palette.colors.gray30
  },
  icon: {
    width: 24,
    height: 24
  },
  titleBox: {},
  adornedEnd: {
    padding: 0
  },
  tabTitle: {
    letterSpacing: -0.5
  },
  wideSelectWrapper: {
    width: '100%'
  },
  changeSize: {
    width: 600
  },
  autoCompleteField: {
    margin: 0,
    padding: 0
  }
})

const descriptions = {
  transparent: (
    <Fragment>
      You need{' '}
      <a
        onClick={e => {
          e.preventDefault()
          shell.openExternal('http://z.cash/')
        }}
        href='z.cash'
      >
        Zcash
      </a>{' '}
      to use Zbay.{' '}
      <a
        onClick={e => {
          e.preventDefault()
          shell.openExternal('http://coinbase.com')
        }}
        href='coinbase.com'
      >
        {`Buy Zcash on Coinbase`}
      </a>{' '}
      and send it to the address below. (Coinbase won't send to private
      addresses, but Zbay automatically moves your Zcash to a private address
      once it arrives.)
    </Fragment>
  ),
  private: 'You can use your private address to exchange ZEC with other people.'
}

export const AddFunds = ({
  classes,
  type,
  address,
  handleChange,
  handleClose,
  handleCopy,
  variant,
  donationAddress,
  setDonationAddress,
  users
}) => {
  const usersArray = users.toList().toJS()
  const donationTarget = usersArray.find(
    user => user.address === donationAddress
  )
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: variant === 'wide' ? 650 : 380, height: height }}
        >
          <Grid
            container
            item
            justify={variant === 'wide' ? 'center' : 'flex-start'}
          >
            <Typography variant={'h3'} className={classes.tabTitle}>
              Add funds to your wallet
            </Typography>
          </Grid>
          <Grid
            container
            item
            justify={variant === 'wide' ? 'center' : 'flex-start'}
          >
            <Grid
              container
              justify='center'
              alignContent='flex-start'
              className={classNames({
                [classes.root]: true,
                [classes.changeSize]: variant === 'wide'
              })}
            >
              <Grid
                item
                direction={'column'}
                className={classes.addressSelectBox}
                container
                justify={'center'}
                alignContent={'center'}
                wrap='wrap'
              >
                <Grid item xs>
                  <Typography
                    className={classes.fieldTitle}
                    variant='subtitle2'
                  >
                    Address to add funds
                  </Typography>
                </Grid>
                <Grid item xs>
                  <Select
                    displayEmpty
                    IconComponent={UnfoldMore}
                    input={
                      <OutlinedInput
                        name='address'
                        id='outlined-address'
                        className={classes.select}
                      />
                    }
                    value={type}
                    onChange={handleChange}
                    className={classNames({
                      [classes.selectWrapper]: true,
                      [classes.wideSelectWrapper]: variant === 'wide'
                    })}
                  >
                    <MenuItem value={'transparent'}>Transparent</MenuItem>
                    <MenuItem value={'private'}>Private</MenuItem>
                  </Select>
                </Grid>
                <Grid className={classes.helperText} item>
                  <Typography variant={'body2'}>
                    {descriptions[type]}
                  </Typography>
                </Grid>
              </Grid>
              <Grid
                container
                className={classes.copyInputBox}
                item
                direction={'column'}
                wrap={'no-wrap'}
                alignContent={'center'}
                justify={'center'}
              >
                <Grid className={classes.titleBox} item xs>
                  <Typography
                    className={classes.fieldTitle}
                    variant='subtitle2'
                  >
                    {type === 'transparent'
                      ? 'Transparent Address'
                      : 'Private Address'}
                  </Typography>
                </Grid>
                <Grid item xs>
                  <TextField
                    id='copy-address'
                    className={classes.copyField}
                    variant='outlined'
                    type='text'
                    value={address}
                    disabled
                    InputProps={{
                      classes: {
                        input: classes.copyInput,
                        adornedEnd: classes.adornedEnd
                      },
                      endAdornment: (
                        <Grid
                          item
                          container
                          justify={'center'}
                          alignItems={'center'}
                          className={classes.iconBox}
                        >
                          <InputAdornment
                            position='end'
                            className={classes.iconBackground}
                          >
                            <CopyToClipboard text={address} onCopy={handleCopy}>
                              <IconButton>
                                <Icon src={CopyIcon} />
                              </IconButton>
                            </CopyToClipboard>
                          </InputAdornment>
                        </Grid>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <Grid
                container
                justify={'center'}
                className={classes.QRCodeBox}
                item
              >
                <Grid container justify={'center'} alignItems={'center'} item>
                  <Grid
                    container
                    justify={'center'}
                    alignItems={'center'}
                    item
                    className={classes.whiteBox}
                  >
                    <QRCode value={address} size={200} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid
                item
                direction={'column'}
                className={classes.addressSelectBox}
                container
                justify={'center'}
                alignContent={'center'}
                wrap='wrap'
              >
                <Grid item xs>
                  <Typography
                    className={classes.fieldTitle}
                    variant='subtitle2'
                  >
                    Donation recipient address or username
                  </Typography>
                </Grid>
                <Grid item xs>
                  <Autocomplete
                    freeSolo
                    name={'recipient'}
                    inputValue={
                      donationTarget ? donationTarget.nickname : donationAddress
                    }
                    options={usersArray.map(option => option.nickname)}
                    filterOptions={(options, state) =>
                      options.filter(o =>
                        o
                          .toLowerCase()
                          .includes(donationAddress || ''.toLowerCase())
                      )
                    }
                    onInputChange={(e, v) => {
                      if (!e) {
                        return
                      }
                      const selected = usersArray.find(
                        user => user.nickname === v
                      )
                      if (selected) {
                        setDonationAddress(selected.address)
                      } else {
                        setDonationAddress(v)
                      }
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        className={classes.autoCompleteField}
                        variant='outlined'
                        placeholder='Enter address or username'
                        margin='normal'
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid className={classes.titleBox} item>
                  <Typography className={classes.infoText} variant='subtitle2'>
                    When you add funds from a transparent address—an exchange,
                    for example—Zbay will donate 1% of these funds to the
                    address or username above. The default recipient is the Zbay
                    team, or—if you accepted funds from an invitation—the user
                    who invited you. You can change the recipient at any time.
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}

AddFunds.propTypes = {
  classes: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  donationAddress: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  users: PropTypes.object.isRequired,
  handleCopy: PropTypes.func,
  setDonationAddress: PropTypes.func
}
AddFunds.defaultProps = {
  handleCopy: () => null
}

export default withStyles(styles)(AddFunds)
