import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'

const styles = {
  root: {},
  wrapper: {
    'min-height': '100vh'
  }
}

export const WindowWrapper = ({ classes, children, className }) => (
  <div className={classNames({
    [classes.wrapper]: true,
    [className]: className
  })}>
    { children }
  </div>
)

export default React.memo(withStyles(styles)(WindowWrapper))
