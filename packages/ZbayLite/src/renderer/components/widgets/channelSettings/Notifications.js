import React from 'react'
import PropTypes from 'prop-types'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import Button from '@material-ui/core/Button'

import Icon from '../../ui/Icon'
import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'
import { notificationFilterType } from '../../../../shared/static'

const styles = theme => ({
  title: {},
  addModerator: {
    color: theme.palette.colors.lushSky,
    '&:hover': {
      color: theme.palette.colors.trueBlack
    },
    cursor: 'pointer'
  },
  titleDiv: {
    marginBottom: 0
  },
  channelNameDiv: {
    marginBottom: 24
  },
  radioDiv: {
    marginLeft: 4
  },
  radioIcon: {
    '& .MuiCheckbox-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent'
      }
    },
    '& .MuiIconButton-colorSecondary': {
      color: theme.palette.colors.zbayBlue
    },
    '& .MuiTypography-body1': {
      fontSize: `14px`,
      lineHeight: `25px`
    }
  },
  infoDiv: {
    marginTop: 5
  },
  button: {
    marginTop: 14,
    height: 60,
    width: 180,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue
  },
  captionDiv: {
    marginTop: 16
  },
  captions: {
    color: theme.palette.colors.darkGray,
    lineHeight: '20px'
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.lushSky
  }
})

export const Notifications = ({
  classes,
  currentFilter,
  setChannelsNotification,
  channelData,
  openNotificationsTab,
  openSettingsModal
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
            <Grid item className={classes.channelNameDiv}>
              <Typography variant='body2'>#{channelData.name}</Typography>
            </Grid>
            {currentFilter !== notificationFilterType.MUTE ? (
              <Grid
                item
                container
                direction='column'
                className={classes.radioDiv}
              >
                <FormControlLabel
                  classes={{ root: classes.radioIcon }}
                  control={
                    <Checkbox
                      icon={<Icon src={radioUnselected} />}
                      checkedIcon={<Icon src={radioChecked} />}
                      checked={
                        notificationFilterType.ALL_MESSAGES === currentFilter
                      }
                    />
                  }
                  onChange={() =>
                    setChannelsNotification(notificationFilterType.ALL_MESSAGES)
                  }
                  label='Every new message'
                />
                <FormControlLabel
                  classes={{ root: classes.radioIcon }}
                  control={
                    <Checkbox
                      icon={<Icon src={radioUnselected} />}
                      checkedIcon={<Icon src={radioChecked} />}
                      checked={
                        notificationFilterType.MENTIONS === currentFilter
                      }
                    />
                  }
                  onChange={() =>
                    setChannelsNotification(notificationFilterType.MENTIONS)
                  }
                  label='Just @mentions'
                />
                <FormControlLabel
                  classes={{ root: classes.radioIcon }}
                  control={
                    <Checkbox
                      icon={<Icon src={radioUnselected} />}
                      checkedIcon={<Icon src={radioChecked} />}
                      checked={notificationFilterType.NONE === currentFilter}
                    />
                  }
                  onChange={() =>
                    setChannelsNotification(notificationFilterType.NONE)
                  }
                  label='Nothing'
                />
              </Grid>
            ) : (
              <Grid item container direction='column'>
                <Grid item>
                  <Typography variant='h4'>
                    You've muted this channel
                  </Typography>
                </Grid>
                <Grid item className={classes.infoDiv}>
                  <Typography variant='body2'>
                    Unmute this channel to change your notification settings.
                  </Typography>
                </Grid>
                <Grid>
                  <Button
                    variant='contained'
                    size='large'
                    color='primary'
                    type='submit'
                    fullWidth
                    className={classes.button}
                    onClick={() => {
                      setChannelsNotification(
                        notificationFilterType.ALL_MESSAGES
                      )
                    }}
                  >
                    Unmute Channel
                  </Button>
                </Grid>
              </Grid>
            )}
            <Grid item className={classes.captionDiv}>
              <Typography variant='caption' className={classes.captions}>
                You can choose how to be alerted or turn off all Zbay
                notifications in your{' '}
                <span
                  className={classes.link}
                  onClick={() => {
                    openSettingsModal()
                    openNotificationsTab()
                  }}
                >
                  Notification Settings
                </span>
                .
              </Typography>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}
Notifications.propTypes = {
  classes: PropTypes.object.isRequired,
  setChannelsNotification: PropTypes.func.isRequired,
  openNotificationsTab: PropTypes.func.isRequired,
  openSettingsModal: PropTypes.func.isRequired,
  currentFilter: PropTypes.number.isRequired,
  channelData: PropTypes.object.isRequired
}
Notifications.defaultProps = {}

export default withStyles(styles)(Notifications)
