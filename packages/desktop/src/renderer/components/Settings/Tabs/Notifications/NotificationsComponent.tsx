import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

import { NotificationsOptions, NotificationsSounds } from '@quiet/state-manager'

import Icon from '../../../ui/Icon/Icon'
import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'
import { direct, relentless, sharp, librarianShhh } from '../../../../../shared/sounds'

const PREFIX = 'Notifications'

const classes = {
  title: `${PREFIX}title`,
  titleDiv: `${PREFIX}titleDiv`,
  subtitle: `${PREFIX}subtitle`,
  radioDiv: `${PREFIX}radioDiv`,
  radioSoundDiv: `${PREFIX}radioSoundDiv`,
  radioIcon: `${PREFIX}radioIcon`,
  bold: `${PREFIX}bold`,
  offset: `${PREFIX}offset`,
  spacing: `${PREFIX}spacing`,
  radioSound: `${PREFIX}radioSound`,
  subtitleSoundDiv: `${PREFIX}subtitleSoundDiv`,
  label: `${PREFIX}label`,
  spacingSound: `${PREFIX}spacingSound`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`& .${classes.title}`]: {},

  [`& .${classes.titleDiv}`]: {
    marginBottom: 24
  },

  [`& .${classes.subtitle}`]: {
    fontSize: 18,
    lineHeight: '27px'
  },

  [`& .${classes.radioDiv}`]: {
    marginLeft: 4
  },

  [`& .${classes.radioSoundDiv}`]: {},

  [`& .${classes.radioIcon}`]: {
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

  [`& .${classes.bold}`]: {
    fontWeight: 500
  },

  [`& .${classes.offset}`]: {
    marginTop: 5
  },

  [`& .${classes.spacing}`]: {
    marginTop: 16
  },

  [`& .${classes.radioSound}`]: {
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

  [`& .${classes.subtitleSoundDiv}`]: {
    marginTop: 40
  },

  [`& .${classes.label}`]: {
    marginTop: 1,
    fontWeight: 500
  },

  [`& .${classes.spacingSound}`]: {
    marginTop: 8
  }
}))

interface NotificationsProps {
  notificationsOption: NotificationsOptions
  notificationsSound: NotificationsSounds
  setNotificationsOption: (type: NotificationsOptions) => void
  setNotificationsSound: (type: NotificationsSounds) => void
}

export const NotificationsComponent: React.FC<NotificationsProps> = ({
  notificationsOption,
  notificationsSound,
  setNotificationsOption,
  setNotificationsSound
}) => {
  return (
    <StyledGrid container direction='column'>
      <Grid
        container
        item
        justifyContent='space-between'
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
              data-testid={'sound-switch'}
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
          <Grid item className={classes.spacingSound} data-testid={`sound-${NotificationsSounds.librarianShhh}`}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  data-testid={`sound-${NotificationsSounds.librarianShhh}-radio`}
                  icon={<Icon src={radioUnselected} />}
                  checkedIcon={<Icon src={radioChecked} />}
                  checked={NotificationsSounds.librarianShhh === notificationsSound}
                />
              }
              onChange={() => {
                setNotificationsSound(NotificationsSounds.librarianShhh)
                void librarianShhh.play()
              }}
              label='Librarian Shhh'
            />
          </Grid>
          <Grid item className={classes.spacingSound} data-testid={`sound-${NotificationsSounds.pow}`}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  data-testid={`sound-${NotificationsSounds.pow}-radio`}
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
          <Grid item className={classes.spacingSound} data-testid={`sound-${NotificationsSounds.bang}`}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  data-testid={`sound-${NotificationsSounds.bang}-radio`}
                  icon={<Icon src={radioUnselected} />}
                  checkedIcon={<Icon src={radioChecked} />}
                  checked={NotificationsSounds.bang === notificationsSound}
                />
              }
              onChange={() => {
                setNotificationsSound(NotificationsSounds.bang)
                void sharp.play()
              }}
              label='Bang'
            />
          </Grid>
          <Grid item className={classes.spacingSound} data-testid={`sound-${NotificationsSounds.splat}`}>
            <FormControlLabel
              classes={{ root: classes.radioSound }}
              control={
                <Checkbox
                  data-testid={`sound-${NotificationsSounds.splat}-radio`}
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
    </StyledGrid>
  )
}
