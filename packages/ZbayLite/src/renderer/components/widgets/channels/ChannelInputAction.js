import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import iconHover from '../../../static/images/zcash/plus-icon.svg'
import icon from '../../../static/images/zcash/plus-icon-gray.svg'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'

const styles = theme => ({
  button: {
    fontSize: 36,
    padding: 2,
    '&:hover': {
      backgroundColor: theme.palette.colors.white
    }
  },
  icon: {
    width: 28,
    height: 28
  }
})

export const ChannelInputAction = ({ classes, onPostOffer, onSendMoney, disabled, directMessageChannel, targetRecipientAddress }) => {
  return (
    <MenuAction
      classes={{
        button: classes.button,
        icon: classes.icon
      }}
      icon={icon}
      iconHover={iconHover}
      offset='-10 12'
      disabled={disabled}
      placement='top-end'
    >
      <MenuActionItem onClick={onPostOffer} title='Post an offer' />
      <MenuActionItem onClick={() => onSendMoney('sendMoney', targetRecipientAddress)} title='Send money' />
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
