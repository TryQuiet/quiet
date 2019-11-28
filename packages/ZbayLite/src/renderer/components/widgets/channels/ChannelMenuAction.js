import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import dotsIcon from '../../../static/images/zcash/dots-icon.svg'
import IconButton from '../../ui/IconButton'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'

const styles = theme => ({
  menuList: {
    padding: `${theme.spacing(1.5)}px 0`
  },
  icon: {
    width: 30,
    height: 30
  }
})

export const ChannelMenuAction = ({ classes, onInfo, onMute, onDelete }) => {
  return (
    <MenuAction icon={dotsIcon} iconHover={dotsIcon} IconButton={IconButton} offset='0 8'>
      <MenuActionItem onClick={onInfo} title='Info' />
      <MenuActionItem onClick={onMute} title='Mute' />
      <MenuActionItem onClick={onDelete} title='Delete' />
    </MenuAction>
  )
}

ChannelMenuAction.propTypes = {
  classes: PropTypes.object.isRequired,
  onInfo: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelMenuAction)
