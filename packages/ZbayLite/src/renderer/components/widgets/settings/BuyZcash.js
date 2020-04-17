import React from 'react'
import PropTypes from 'prop-types'
import { shell } from 'electron'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import MenuItem from '@material-ui/core/MenuItem'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import UnfoldMore from '@material-ui/icons/UnfoldMore'
import Select from '@material-ui/core/Select'

import countryData from './countryData'

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
const types = {
  MAIN: 1,
  MINOR: 2,
  OTHER: 3
}
const contriesType = {
  [types.MAIN]: [
    `Australia`,
    `Canada`,
    `Singapore`,
    `United States`,
    `United Kingdom`,
    `Andorra`,
    `Austria`,
    `Belgium`,
    `Bulgaria`,
    `Croatia`,
    `Cyprus`,
    `Czech Republic`,
    `Denmark`,
    `Estonia`,
    `Finland`,
    `France`,
    `Gibraltar`,
    `Greece`,
    `Guernsey`,
    `Hungary`,
    `Iceland`,
    `Ireland`,
    `Isle of Man`,
    `Italy`,
    `Jersey`,
    `Latvia`,
    `Liechtenstein`,
    `Lithuania`,
    `Luxembourg`,
    `Malta`,
    `Monaco`,
    `Netherlands`,
    `Norway`,
    `Poland`,
    `Portugal`,
    `Romania`,
    `San Marino`,
    `Slovakia`,
    `Slovenia`,
    `Spain`,
    `Sweden`,
    `Switzerland`
  ],
  [types.MINOR]: [
    `Afghanistan`,
    `Algeria`,
    `Angola`,
    `Antigua and Barbuda`,
    `Bangladesh`,
    `Bolivia`,
    `Bosnia and Herzegovina`,
    `Botswana`,
    `Cambodia`,
    `China`,
    `Cuba`,
    `Democratic Republic of the Congo`,
    `Ecuador`,
    `Egypt`,
    `Eritrea`,
    `Ethiopia`,
    `Gambia`,
    `Ghana`,
    `Guinea-Bissau`,
    `Guyana`,
    `Indonesia`,
    `Iran`,
    `Iraq`,
    `ivory coast`,
    `Japan`,
    `Kyrgyzstan`,
    `Laos`,
    `Lebanon`,
    `Lesotho`,
    `Liberia`,
    `Libya`,
    `Macedonia`,
    `Malaysia`,
    `Mali`,
    `Morocco`,
    `Myanmar`,
    `Namibia`,
    `Nepal`,
    `Niger`,
    `Nigeria`,
    `North Korea`,
    `Pakistan`,
    `Papua New Guinea`,
    `Qatar`,
    `Democratic Republic Of The Congo`,
    `Senegal`,
    `Sierra Leone`,
    `Somalia`,
    `South Sudan`,
    `Sri Lanka`,
    `Sudan`,
    `Syria`,
    `Tanzania`,
    `Togo`,
    `Trinidad and Tobago`,
    `Uganda`,
    `Vanuatu`,
    `Vietnam`,
    `Yemen`,
    `Zambia`,
    `Zimbabwe`
  ],
  [types.OTHER]: []
}
const countryToType = country => {
  if (contriesType[types.MAIN].includes(country)) {
    return types.MAIN
  }
  if (contriesType[types.MINOR].includes(country)) {
    return types.MINOR
  }
  return types.OTHER
}

export const BuyZcash = ({ classes }) => {
  const [country, setCountry] = React.useState('United States')
  const [type, setType] = React.useState(types.MAIN)
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
        {(type === types.MAIN || type === types.OTHER) && (
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
            , choose to buy ZEC, and paste in your Zcash address. You’ll have to
            provide a credit card and complete some steps to verify your
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
            Zbay is experimental, so don't store too much money in it (say, no
            more than the cost of a nice dinner.)
          </li>
          <li className={classes.spacing24}>
            If your computer is broken, lost, or stolen and you don't have a
            full backup (like [Backblaze] or [Time Machine] on Mac) you will
            lose your Zbay account, your direct messages, and your funds. The
            best way to keep your funds and account safe is to make a secure
            backup of your computer, either offline (with Time Machine on Mac)
            or with a key you control (you can do this with Backblaze).
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
