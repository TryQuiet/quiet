import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import AddIcon from '@material-ui/icons/Add'

import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'

const styles = theme => ({
  button: {
    border: 'solid rgba(0, 0, 0, 0.23) 1px',
    borderRadius: '10%',
    padding: 2
  },
  icon: {
    fontSize: 32,
    color: theme.palette.primary.ligth
  }
})

export const ChannelInputAction = ({ classes, onPostOffer, onSendMoney }) => (
  <MenuAction
    classes={{
      button: classes.button,
      icon: classes.icon
    }}
    Icon={AddIcon}
    offset='0 12'
  >
    <MenuActionItem onClick={onPostOffer} title='Post an offer' />
    <MenuActionItem onClick={onSendMoney} title='Send money' />
  </MenuAction>
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
