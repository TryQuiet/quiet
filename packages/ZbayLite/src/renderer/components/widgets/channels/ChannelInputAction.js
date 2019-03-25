import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import AddIcon from '@material-ui/icons/Add'

import MenuAction from '../MenuAction'
import { MenuItem } from './types'

const styles = {
  button: {
    border: 'solid rgba(0, 0, 0, 0.23) 1px',
    borderRadius: '10%',
    padding: 2
  },
  icon: {
    fontSize: 32
  }
}

export const ChannelInputAction = ({ classes, onPostOffer, onSendMoney }) => (
  <MenuAction
    classes={{
      button: classes.button,
      icon: classes.icon
    }}
    Icon={AddIcon}
    offset='0 12'
    menuItems={[
      MenuItem({
        title: 'Post an offer',
        onClick: onPostOffer
      }),
      MenuItem({
        title: 'Send money',
        onClick: onSendMoney
      })
    ]}
  />
)

ChannelInputAction.propTypes = {
  classes: PropTypes.object.isRequired,
  onPostOffer: PropTypes.func.isRequired,
  onSendMoney: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInputAction)
