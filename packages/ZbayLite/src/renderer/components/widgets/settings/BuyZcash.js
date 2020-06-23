import React from 'react'
import PropTypes from 'prop-types'
import { shell, remote } from 'electron'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import MenuItem from '@material-ui/core/MenuItem'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import UnfoldMore from '@material-ui/icons/UnfoldMore'
import Select from '@material-ui/core/Select'

import countryData from './countryData'
import {
  types,
  countryToType,
  getCountryName
} from '../../../../shared/countryCodes'

const styles = theme => ({
  title: {},
  subtitle: {
    marginTop: 32,
    color: theme.palette.colors.black30,
    fontWeight: 500
  },
  selectDiv: {
    marginTop: 16
  },
  infoDiv: {
    marginTop: 24
  },
  spacing16: {
    marginTop: 16
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  },
  spacing24: {
    marginTop: 24
  }
})

export const BuyZcash = ({ classes }) => {
  const [country, setCountry] = React.useState(
    getCountryName(remote.app.getLocaleCountryCode())
  )
  const [type, setType] = React.useState(
    countryToType(getCountryName(remote.app.getLocaleCountryCode()))
  )
  React.useEffect(() => {
    setType(countryToType(country))
  }, [country])
  return (
    <Grid container direction='column'>
      <Grid item className={classes.title}>
        <Typography variant='h3'>Buy Zcash</Typography>
      </Grid>
      <Grid item>
        <Typography variant='body2' className={classes.subtitle}>
          What country do you live in?
        </Typography>
      </Grid>
      <Grid item className={classes.selectDiv}>
        <Select
          id='region'
          name='region'
          fullWidth
          IconComponent={UnfoldMore}
          value={country}
          onChange={e => {
            setCountry(e.target.value)
          }}
          input={<OutlinedInput />}
        >
          {Object.keys(countryData).map(r => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid item className={classes.infoDiv}>
        {type === types.MINOR && (
          <Typography variant='body2'>
            We’re not sure what the best way to buy Zcash in your country. Our
            suggestion would be to find your local Bitcoin community and ask
            around! If you find a service that makes it easy, let us know!
          </Typography>
        )}
        {(type === types.MAIN || type === types.OTHER) &&
          country !== `United States` && (
          <Typography variant='body2'>
              The easiest way to buy Zcash in your country is Indacoin. Visit
              their{' '}
            <a
              className={classes.link}
              onClick={e => {
                e.preventDefault()
                shell.openExternal('https://indacoin.com/')
              }}
              href='https://indacoin.com/'
            >
                website
            </a>
              , choose to buy ZEC, and paste in your Zcash address. You’ll have
              to provide a credit card and complete some steps to verify your
              identity.
          </Typography>
        )}
        {type === types.MAIN && (
          <>
            <Typography variant='body2' className={classes.spacing16}>
              Coinbase is also an excellent service that works in your country,
              but there will be a few more steps required. Coinbase has a{' '}
              <a
                className={classes.link}
                onClick={e => {
                  e.preventDefault()
                  shell.openExternal('http://coinbase.com')
                }}
                href='coinbase.com'
              >
                website
              </a>
              , but if you have an iPhone or a reputable Android phone, the app
              is more secure and easy to use.
            </Typography>
            <Typography variant='body2' className={classes.spacing16}>
              Due to U.S. laws, you'll have to provide a social security number
              and a copy of your ID, but they make it easy.
            </Typography>
            <Typography variant='body2' className={classes.spacing16}>
              Get the Coinbase App on{' '}
              <a
                className={classes.link}
                onClick={e => {
                  e.preventDefault()
                  shell.openExternal(
                    'https://play.google.com/store/apps/details?id=com.coinbase.android&hl=en'
                  )
                }}
                href='https://play.google.com/store/apps/details?id=com.coinbase.android&hl=en'
              >
                Google Play
              </a>{' '}
              or the{' '}
              <a
                className={classes.link}
                onClick={e => {
                  e.preventDefault()
                  shell.openExternal(
                    'https://apps.apple.com/us/app/coinbase-buy-sell-bitcoin'
                  )
                }}
                href='https://apps.apple.com/us/app/coinbase-buy-sell-bitcoin'
              >
                App Store
              </a>
              .
            </Typography>
          </>
        )}
        <Typography variant='body2' className={classes.spacing16}>
          Other things you should know:
        </Typography>
        <ul>
          <li className={classes.spacing24}>
            Zcash is its own currency, like the dollar or euro, so its value can
            go up or down.
          </li>
          <li className={classes.spacing24}>
            Zbay is experimental, so don't store any amount of funds you would
            not want to lose.
          </li>
          <li className={classes.spacing24}>
            If your computer is broken, lost, or stolen and you don't have a
            full backup, you will lose your Zbay account, your direct messages,
            and your funds.
          </li>
          <li className={classes.spacing24}>
            The best way to keep your funds and account safe is to make frequent
            secure backups of your entire computer, either offline using a tool
            like{' '}
            <a
              className={classes.link}
              onClick={e => {
                e.preventDefault()
                shell.openExternal('https://support.apple.com/en-us/HT201250')
              }}
              href='https://support.apple.com/en-us/HT201250'
            >
              Time Machine
            </a>{' '}
            (Mac) or online with a key you control, using a service like{' '}
            <a
              className={classes.link}
              onClick={e => {
                e.preventDefault()
                shell.openExternal('https://www.backblaze.com/')
              }}
              href='https://www.backblaze.com/'
            >
              Backblaze
            </a>
            .
          </li>
        </ul>
      </Grid>
    </Grid>
  )
}
BuyZcash.propTypes = {
  classes: PropTypes.object.isRequired
}
BuyZcash.defaultProps = {}

export default withStyles(styles)(BuyZcash)
