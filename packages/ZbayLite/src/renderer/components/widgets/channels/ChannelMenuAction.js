import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import MoreHorizIcon from '@material-ui/icons/MoreHoriz'

import IconButton from '../../ui/IconButton'
import MenuAction from '../../widgets/MenuAction'
import { MenuItem } from './types'

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
    menuItems={[
      MenuItem({
        title: 'Info',
        onClick: onInfo
      }),
      MenuItem({
        title: 'Mute',
        onClick: onMute
      }),
      MenuItem({
        title: 'Delete',
        onClick: onDelete
      })
    ]}
    offset='0 8'
  />
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
