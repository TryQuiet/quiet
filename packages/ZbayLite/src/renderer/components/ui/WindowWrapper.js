import React from 'react'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'

const styles = {
  root: {},
  wrapper: {
    'min-height': '100vh',
    WebkitAppRegion: 'drag'
  }
}

export const WindowWrapper = ({ classes, children, className }) => (
  <div
    className={classNames({
      [classes.wrapper]: true,
      [className]: className
    })}
  >
    {children}
  </div>
)

export default React.memo(withStyles(styles)(WindowWrapper))
