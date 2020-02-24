import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Immutable from 'immutable'

import { withStyles } from '@material-ui/core/styles'

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
  }
})

export const ChannelMenuAction = ({
  classes,
  onInfo,
  onMute,
  onDelete,
  publishChannel,
  isOwner,
  publicChannels,
  channel,
  onSettings
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
      <MenuActionItem onClick={onInfo} title='Info' />
      <MenuActionItem onClick={onMute} title='Mute' />
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
      {isOwner && alreadyRegistered ? (
        <MenuActionItem onClick={onSettings} title='Settings' />
      ) : (
        <span />
      )}
      {isOwner && !alreadyRegistered ? (
        <MenuActionItem onClick={publishChannel} title='Make public' />
      ) : (
        <span />
      )}
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
  isOwner: PropTypes.bool.isRequired,
  publicChannels: PropTypes.object.isRequired,
  channel: PropTypes.object.isRequired
}
ChannelMenuAction.defaultProps = {
  publicChannels: Immutable.Map({})
}

export default R.compose(React.memo, withStyles(styles))(ChannelMenuAction)
