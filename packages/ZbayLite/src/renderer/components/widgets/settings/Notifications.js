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
import { notificationFilterType } from '../../../../shared/static'

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
  }
})

export const Notifications = ({
  classes,
  userFilterType,
  setUserNotification
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
  setUserNotification: PropTypes.func.isRequired
}
Notifications.defaultProps = {}
export default withStyles(styles)(Notifications)
