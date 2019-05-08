import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import MoreHorizIcon from '@material-ui/icons/MoreHoriz'

import IconButton from '../../ui/IconButton'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'

const styles = theme => ({
  menuItem: {
    height: 8,
    width: 80,
    paddingLeft: 2.5 * theme.spacing.unit,
    paddingRight: 2.5 * theme.spacing.unit,
    fontSize: '0.75rem'
  },
  menuList: {
    padding: `${1.5 * theme.spacing.unit}px 0`
  }
})

export const ChannelMenuAction = ({ classes, onInfo, onMute, onDelete }) => (
  <MenuAction
    classes={{
      button: classes.button,
      icon: classes.icon
    }}
    Icon={MoreHorizIcon}
    IconButton={IconButton}
    offset='0 8'
  >
    <MenuActionItem onClick={onInfo} title='Info' />
    <MenuActionItem onClick={onMute} title='Mute' />
    <MenuActionItem onClick={onDelete} title='Delete' />
  </MenuAction>
)

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
