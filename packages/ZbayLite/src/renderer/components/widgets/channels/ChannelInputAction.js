import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import icon from '../../ui/assets/plusIcon.png'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'

const styles = theme => ({
  button: {
    fontSize: 36,
    padding: 2
  },
  icon: {
    width: 40,
    height: 40
  }
})
const Icon = ({ className }) => <img className={className} src={icon} />
export const ChannelInputAction = ({ classes, onPostOffer, onSendMoney, disabled }) => {
  return (
    <MenuAction
      classes={{
        button: classes.button,
        icon: classes.icon
      }}
      Icon={Icon}
      offset='-10 12'
      disabled={disabled}
      placement='top-end'
    >
      <MenuActionItem onClick={onPostOffer} title='Post an offer' />
      <MenuActionItem onClick={onSendMoney} title='Send money' />
    </MenuAction>
  )
}

ChannelInputAction.propTypes = {
  classes: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  onPostOffer: PropTypes.func.isRequired,
  onSendMoney: PropTypes.func.isRequired
}

ChannelInputAction.defaultProps = {
  disabled: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelInputAction)
