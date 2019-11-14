import React from 'react'
import QRCode from 'qrcode.react'
import PropTypes from 'prop-types'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

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

import Icon from '../../ui/Icon'
import CopyIcon from '../../../../renderer/static/images/copylink.svg'

const styles = theme => ({
  root: {
    marginLeft: 33,
    backgroundColor: theme.palette.colors.white,
    width: 348,
    borderRadius: 4,
    border: `1px solid ${theme.palette.colors.inputGray}`
  },
  title: {
    paddingBottom: theme.spacing(1)
  },
  select: {
  },
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
    width: 300,
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
  helperText: {
    marginTop: 24
  },
  addressSelectBox: {
    padding: '0  24px 24px',
    borderBottom: `1px solid ${theme.palette.colors.inputGray}`
  },
  QRCodeBox: {
    width: 348,
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
    marginTop: 0
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
  titleBox: {
    paddingLeft: 24
  },
  adornedEnd: {
    padding: 0
  },
  tabTitle: {
    marginLeft: 33,
    marginBottom: 24
  }
})

export const AddFunds = ({
  classes,
  type,
  address,
  description,
  handleChange,
  handleClose,
  handleCopy
}) => (
  <AutoSizer>
    {({ width, height }) => (
      <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
        <Grid className={classes.tabTitle} item>
          <Typography variant={'h3'}>Add funds to your wallet</Typography>
        </Grid>
        <Grid container justify='center' alignContent='flex-start' className={classes.root}>
          <Grid item direction={'column'} className={classes.addressSelectBox} container justify={'center'} alignContent={'center'} wrap='wrap'>
            <Grid item xs>
              <Typography className={classes.fieldTitle} variant='subtitle2'>
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
                  />}
                value={type}
                onChange={handleChange}
                className={classes.selectWrapper}
              >
                <MenuItem value={'transparent'}>transparent</MenuItem>
                <MenuItem value={'private'}>private</MenuItem>
              </Select>
            </Grid>
            <Grid className={classes.helperText} item>
              <Typography variant={'body2'}>{description}</Typography>
            </Grid>
          </Grid>
          <Grid container justify={'center'} className={classes.QRCodeBox} item>
            <Grid container justify={'center'} alignItems={'center'} item>
              <Grid container justify={'center'} alignItems={'center'} item className={classes.whiteBox}>
                <QRCode value={address} size={200} />
              </Grid>
            </Grid>
          </Grid>
          <Grid container className={classes.copyInputBox} item justify={'center'}>
            <Grid className={classes.titleBox} item xs>
              <Typography className={classes.fieldTitle} variant='subtitle2'>
                {type === 'transparent' ? 'Transparent Address' : 'Private Address'}
              </Typography>
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
                  classes: { input: classes.copyInput, adornedEnd: classes.adornedEnd },
                  endAdornment: (
                    <Grid item container justify={'center'} alignItems={'center'} className={classes.iconBox}>
                      <InputAdornment position='end' className={classes.iconBackground}>
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
        </Grid>
      </Scrollbars>
    )}
  </AutoSizer>
)

AddFunds.propTypes = {
  classes: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

AddFunds.defaultProps = {
  handleCopy: () => null
}

export default withStyles(styles)(AddFunds)
