import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import MuiMenuItem from '@material-ui/core/MenuItem'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    minHeight: 25,
    margin: 0,
    fontSize: 14,
    letterSpacing: 0.4,
    paddingTop: 5,
    paddingBottom: 5
  }
})

export const MenuActionItem = ({
  classes,
  onClick,
  title,
  close,
  closeAfterAction
}) => {
  return (
    <MuiMenuItem
      onClick={e => {
        onClick(e)
        closeAfterAction && close()
      }}
      className={classes.root}
      key={title}
    >
      {title}
    </MuiMenuItem>
  )
}
MenuActionItem.propTypes = {
  classes: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  closeAfterAction: PropTypes.bool.isRequired
}
MenuActionItem.defaultProps = {
  closeAfterAction: true
}
export default R.compose(React.memo, withStyles(styles))(MenuActionItem)
