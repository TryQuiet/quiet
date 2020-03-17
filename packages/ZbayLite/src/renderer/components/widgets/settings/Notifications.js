import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'

import Icon from '../../ui/Icon'
import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'
import { notificationFilterType, soundType } from '../../../../shared/static'
import { direct, relentless, sharp } from '../../../../shared/sounds'

const styles = theme => ({
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
      color: theme.palette.colors.zbayBlue
    },
    '& .MuiTypography-body1': {
      fontSize: `14px`,
      lineHeight: `25px`
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
})

export const Notifications = ({
  classes,
  userFilterType,
  setUserNotification,
  userSound,
  setUserNotificationsSound
}) => {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: width, height: height, overflowX: 'hidden' }}
        >
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
            <Grid item className={classes.subtitleDiv}>
              <Typography variant='h5' className={classes.subtitle}>
                Notify me about...
              </Typography>
            </Grid>
            <Grid
              item
              container
              direction='column'
              className={classes.radioDiv}
            >
              <Grid item className={classes.spacing}>
                <FormControlLabel
                  classes={{ root: classes.radioIcon }}
                  control={
                    <Checkbox
                      icon={<Icon src={radioUnselected} />}
                      checkedIcon={<Icon src={radioChecked} />}
                      checked={
                        notificationFilterType.ALL_MESSAGES === userFilterType
                      }
                    />
                  }
                  onChange={() =>
                    setUserNotification(notificationFilterType.ALL_MESSAGES)
                  }
                  label={
                    <Grid
                      containter
                      direction='column'
                      className={classes.offset}
                    >
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
                      checked={
                        notificationFilterType.MENTIONS === userFilterType
                      }
                    />
                  }
                  onChange={() =>
                    setUserNotification(notificationFilterType.MENTIONS)
                  }
                  label={
                    <Grid
                      containter
                      direction='column'
                      className={classes.offset}
                    >
                      <Grid item>
                        <span className={classes.bold}>
                          Direct messages, mentions & keywords
                        </span>
                      </Grid>
                      <Grid item>
                        <span>
                          You’ll be notified when someone mentions you or sends
                          you a direct message.
                        </span>
                      </Grid>
                    </Grid>
                  }
                />
              </Grid>
              <Grid item className={classes.spacing}>
                <FormControlLabel
                  classes={{ root: classes.radioIcon }}
                  control={
                    <Checkbox
                      icon={<Icon src={radioUnselected} />}
                      checkedIcon={<Icon src={radioChecked} />}
                      checked={notificationFilterType.NONE === userFilterType}
                    />
                  }
                  onChange={() =>
                    setUserNotification(notificationFilterType.NONE)
                  }
                  label={
                    <Grid
                      containter
                      direction='column'
                      className={classes.offset}
                    >
                      <Grid item>
                        <span className={classes.bold}>Nothing</span>
                      </Grid>
                      <Grid item>
                        <span>
                          You won’t receive notificaitons from Zbay. You will
                          still see badges within Zbay.
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
                <Grid item className={classes.labelDiv}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={userSound !== soundType.NONE}
                        onChange={e => {
                          if (e.target.checked) {
                            setUserNotificationsSound(soundType.POW)
                          } else {
                            setUserNotificationsSound(soundType.NONE)
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
                        checked={soundType.POW === userSound}
                      />
                    }
                    onChange={() => {
                      setUserNotificationsSound(soundType.POW)

                      direct.play()
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
                        checked={soundType.BANG === userSound}
                      />
                    }
                    onChange={() => {
                      sharp.play()
                      setUserNotificationsSound(soundType.BANG)
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
                        checked={soundType.SPLAT === userSound}
                      />
                    }
                    onChange={() => {
                      relentless.play()
                      setUserNotificationsSound(soundType.SPLAT)
                    }}
                    label='Splat'
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}
Notifications.propTypes = {
  classes: PropTypes.object.isRequired,
  userFilterType: PropTypes.number.isRequired,
  userSound: PropTypes.number.isRequired,
  setUserNotification: PropTypes.func.isRequired,
  setUserNotificationsSound: PropTypes.func.isRequired
}
Notifications.defaultProps = {}
export default withStyles(styles)(Notifications)
