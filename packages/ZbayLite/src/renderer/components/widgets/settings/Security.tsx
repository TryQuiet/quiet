import React from 'react'
import { shell } from 'electron'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import UserListItem from '../channelSettings/UserListItem'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

const useStyles = makeStyles((theme) => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  alignLabel: {
    marginTop: 3
  },
  labelDiv: {
    marginTop: 16,
    marginBottom: 24
  },
  itemName: {
    fontSize: 14
  },
  imageHostsDiv: {
    marginTop: 32
  },
  button: {
    height: 60,
    marginTop: 24,
    width: 168,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  rescanButton: {
    height: 60,
    marginTop: 24,
    width: 240,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue,
    marginBottom: 24
  },
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  }
}))

interface SecurityProps {
  allowAll: boolean
  toggleAllowAll: (arg: boolean) => void
  openSeedModal: () => void
  whitelisted: any[]
  removeSiteHost: (hostname: string) => void
}

export const Security: React.FC<SecurityProps> = ({
  allowAll,
  toggleAllowAll,
  openSeedModal,
  whitelisted,
  removeSiteHost
}) => {
  const classes = useStyles({})
  return (
    <Grid container direction='column'>
      <Grid container item justify='space-between' alignItems='center' className={classes.titleDiv}>
        <Grid item className={classes.title}>
          <Typography variant='h3'>Security</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Grid item >
          <Typography variant='h5'>Your private recovery key</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2'>
            If something happens to your computer, you’ll need this key to recover your account and
            your funds.
          </Typography>
        </Grid>
        <Grid item >
          <LoadingButton
            variant='contained'
            size='large'
            color='primary'
            type='submit'
            fullWidth={true}
            inProgress={false}
            onClick={() => {
              openSeedModal()
            }}
            text='View key'
            classes={{ button: classes.button }}
          />
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='h5'>P2P messaging over Tor</Typography>
      </Grid>
      <Grid item>
        <Typography variant='body2'>
          For faster message delivery, Zbay can send and receive messages directly with Tor (instead
          of the Zcash blockchain) when other users are online.{' '}
          <a
            className={classes.link}
            onClick={e => {
              e.preventDefault()
              void shell.openExternal('https://www.zbay.app/faq.html')
            }}
            href='https://www.zbay.app/faq.html'>
            Learn more.
          </a>
        </Typography>
      </Grid>
      <Grid item >
        <Typography variant='h5'>Verification</Typography>
      </Grid>
      <Grid item >
        <Typography variant='h5'>Outbound Links</Typography>
      </Grid>
      <Grid item className={classes.labelDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowAll}
              onChange={e => {
                toggleAllowAll(e.target.checked)
              }}
              color='default'
            />
          }
          label={
            <Typography variant='body2' className={classes.alignLabel}>
              Never warn me about outbound link on Zbay.
            </Typography>
          }
        />
      </Grid>
      {!!whitelisted?.length && (
        <>
          <Grid item >
            <Typography variant='h5'>Allowed sites</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Links from these sites will not trigger warrning:
            </Typography>
          </Grid>
          {whitelisted.map(hostname => {
            return (
              <Grid item key={hostname}>
                <UserListItem
                  name={hostname}
                  actionName='Remove'
                  prefix=''
                  action={() => {
                    removeSiteHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </>
      )}
      {/* {!!autoload.length && (
        <Grid item className={classes.imageHostsDiv}>
          <Grid item className={classes.subtitle}>
            <Typography variant='h5'>Allowed image hosts</Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              Images from these sites will be auto-loaded:
            </Typography>
          </Grid>
          {autoload.map(hostname => {
            return (
              <Grid item key={hostname}>
                <UserListItem
                  name={hostname.substring(0, 30)}
                  classes={{ name: classes.itemName }}
                  actionName='Remove'
                  prefix=''
                  action={() => {
                    removeImageHost(hostname)
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      )} */}
    </Grid>
  )
}

export default Security
