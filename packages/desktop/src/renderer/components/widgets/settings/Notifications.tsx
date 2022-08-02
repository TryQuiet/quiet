import React from 'react'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import Icon from '../../ui/Icon/Icon'
import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'
import { direct, relentless, sharp } from '../../../../shared/sounds'
import { NotificationsOptions, NotificationsSounds } from '@quiet/state-manager'

const useStyles = makeStyles((theme) => ({
  title: {},
  titleDiv: {
    marginBottom: 24
  },
  subtitle: {
    fontSize: 18,
    lineHeight: '27px'
  },
  radioDiv: {
    marginLeft: 4
  },
  radioSoundDiv: {},
  radioIcon: {
    alignItems: 'flex-start',
    '& .MuiCheckbox-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent'
      },
      display: 'block'
    },
    '& .MuiIconButton-colorSecondary': {
      color: theme.palette.colors.quietBlue
    },
    '& .MuiTypography-body1': {
      fontSize: '14px',
      lineHeight: '25px'
    }
  },
  bold: {
    fontWeight: 500
  },
  offset: {
    marginTop: 5
  },
  spacing: {
    marginTop: 16
  },
  radioSound: {
    '& .MuiCheckbox-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent'
      },
      display: 'block'
    },
    marginLeft: 23,
    height: 24
  },
  subtitleSoundDiv: {
    marginTop: 40
  },
  label: {
    marginTop: 1,
    fontWeight: 500
  },
  spacingSound: {
    marginTop: 8
  }
}))

interface NotificationsProps {
  notificationsOption: NotificationsOptions
  notificationsSound: NotificationsSounds
  setNotificationsOption: (type: NotificationsOptions) => void
  setNotificationsSound: (type: NotificationsSounds) => void
}

export const Notifications: React.FC<NotificationsProps> = ({
  notificationsOption,
  notificationsSound,
  setNotificationsOption,
  setNotificationsSound
}) => {
  const classes = useStyles({})
  return (
    <Grid container direction='column'>
      <Grid
        container
        item
        justify='space-between'
        alignItems='center'
        className={classes.titleDiv}
      >
        <Grid item className={classes.title}>
          <Typography variant='h3'>Notifications</Typography>
        </Grid>
      </Grid>
      <Grid item >
        <Typography variant='h5' className={classes.subtitle}>
          Notify me about...
        </Typography>
      </Grid>
      <Grid item container direction='column' className={classes.radioDiv}>
        <Grid item className={classes.spacing}>
          <FormControlLabel
            classes={{ root: classes.radioIcon }}
            control={
              <Checkbox
                icon={<Icon src={radioUnselected} />}
                checkedIcon={<Icon src={radioChecked} />}
                checked={NotificationsOptions.notifyForEveryMessage === notificationsOption}
              />
            }
            onChange={() =>
              setNotificationsOption(NotificationsOptions.notifyForEveryMessage)
            }
            label={
              <Grid container direction='column' className={classes.offset}>
                <Grid item>
                  <span className={classes.bold}>Every new message</span>
                </Grid>
                <Grid item>
                  <span>You’ll be notified for every new message</span>
                </Grid>
              </Grid>
            }
          />{' '}
        </Grid>
        <Grid item className={classes.spacing}>
          <FormControlLabel
            classes={{ root: classes.radioIcon }}
            control={
              <Checkbox
                icon={<Icon src={radioUnselected} />}
                checkedIcon={<Icon src={radioChecked} />}
                checked={NotificationsOptions.doNotNotifyOfAnyMessages === notificationsOption}
              />
            }
            onChange={() => setNotificationsOption(NotificationsOptions.doNotNotifyOfAnyMessages)}
            label={
              <Grid container direction='column' className={classes.offset}>
                <Grid item>
                  <span className={classes.bold}>Nothing</span>
                </Grid>
                <Grid item>
                  <span>
                    You won’t receive notificaitons from Quiet.
                  </span>
                </Grid>
              </Grid>
            }
          />
        </Grid>
        <Grid item className={classes.subtitleSoundDiv}>
          <Typography variant='h5' className={classes.subtitle}>
            Sounds
          </Typography>
        </Grid>
        <Grid
          item
          container
          direction='column'
          className={classes.radioSoundDiv}
        >
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  checked={notificationsSound !== NotificationsSounds.none}
                  onChange={e => {
                    if (e.target.checked) {
                      setNotificationsSound(NotificationsSounds.pow)
                    } else {
                      setNotificationsSound(NotificationsSounds.none)
                    }
                  }}
                  color='default'
                />
              }
              label={
                <Typography variant='body2' className={classes.label}>
                  Play a sound when receiving a notification
                </Typography>
              }
            />
          </Grid>
          <Grid item className={classes.spacingSound}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  icon={<Icon src={radioUnselected} />}
                  checkedIcon={<Icon src={radioChecked} />}
                  checked={NotificationsSounds.pow === notificationsSound}
                />
              }
              onChange={() => {
                setNotificationsSound(NotificationsSounds.pow)

                void direct.play()
              }}
              label='Pow'
            />
          </Grid>
          <Grid item className={classes.spacingSound}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  icon={<Icon src={radioUnselected} />}
                  checkedIcon={<Icon src={radioChecked} />}
                  checked={NotificationsSounds.bang === notificationsSound}
                />
              }
              onChange={() => {
                void sharp.play()
                setNotificationsSound(NotificationsSounds.bang)
              }}
              label='Bang'
            />
          </Grid>
          <Grid item className={classes.spacingSound}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  icon={<Icon src={radioUnselected} />}
                  checkedIcon={<Icon src={radioChecked} />}
                  checked={NotificationsSounds.splat === notificationsSound}
                />
              }
              onChange={() => {
                void relentless.play()
                setNotificationsSound(NotificationsSounds.splat)
              }}
              label='Splat'
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Notifications
