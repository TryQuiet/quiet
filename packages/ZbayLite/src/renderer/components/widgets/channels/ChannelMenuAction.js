import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Immutable from 'immutable'

import { withStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import dotsIcon from '../../../static/images/zcash/dots-icon.svg'
import IconButton from '../../ui/IconButton'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'
import ConfirmModal from '../channelSettings/ConfirmModal'

const styles = theme => ({
  menuList: {
    padding: `${theme.spacing(1.5)}px 0`
  },
  icon: {
    width: 30,
    height: 30
  },
  sublabel: {
    color: theme.palette.colors.darkGray,
    letterSpacing: 0.4,
    fontSize: 12,
    lineHeight: '18px'
  }
})

export const ChannelMenuAction = ({
  classes,
  onInfo,
  onMute,
  onUnmute,
  onDelete,
  publishChannel,
  isOwner,
  publicChannels,
  channel,
  onSettings,
  mutedFlag,
  disableSettings,
  notificationFilter,
  openNotificationsTab
}) => {
  const alreadyRegistered = publicChannels.find(
    ch => ch.address === channel.get('address')
  )
  const [openDialog, setOpenDialog] = React.useState(false)
  return (
    <MenuAction
      icon={dotsIcon}
      iconHover={dotsIcon}
      IconButton={IconButton}
      offset='0 8'
    >
      <MenuActionItem onClick={onInfo} title='Info & Invites' />

      <MenuActionItem
        onClick={
          alreadyRegistered
            ? onDelete
            : e => {
              e.preventDefault()
              setOpenDialog(true)
            }
        }
        closeAfterAction={false}
        title='Remove'
      />

      {!disableSettings ? (
        <MenuActionItem onClick={onSettings} title='Settings' />
      ) : (
        <span />
      )}
      {!disableSettings ? (
        <MenuActionItem
          onClick={() => {
            openNotificationsTab()
            onSettings()
          }}
          title={
            <Grid container direction='column'>
              <Grid item>Notifications</Grid>
              <Grid item className={classes.sublabel}>
                {notificationFilter}
              </Grid>
            </Grid>
          }
        />
      ) : (
        <span />
      )}

      {isOwner && !alreadyRegistered ? (
        <MenuActionItem onClick={publishChannel} title='Make public' />
      ) : (
        <span />
      )}
      <MenuActionItem
        onClick={mutedFlag ? onUnmute : onMute}
        title={mutedFlag ? `Unmute` : `Mute`}
      />
      <ConfirmModal
        open={openDialog}
        title={`Are you sure you want to remove this channel?`}
        actionName='Yes'
        cancelName='No'
        handleClose={() => setOpenDialog(false)}
        handleAction={onDelete}
      />
    </MenuAction>
  )
}

ChannelMenuAction.propTypes = {
  classes: PropTypes.object.isRequired,
  onInfo: PropTypes.func.isRequired,
  publishChannel: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSettings: PropTypes.func.isRequired,
  onUnmute: PropTypes.func.isRequired,
  openNotificationsTab: PropTypes.func.isRequired,
  isOwner: PropTypes.bool.isRequired,
  mutedFlag: PropTypes.bool.isRequired,
  disableSettings: PropTypes.bool.isRequired,
  publicChannels: PropTypes.object.isRequired,
  channel: PropTypes.object.isRequired,
  notificationFilter: PropTypes.number.isRequired
}
ChannelMenuAction.defaultProps = {
  publicChannels: Immutable.Map({}),
  disableSettings: false
}

export default R.compose(React.memo, withStyles(styles))(ChannelMenuAction)
