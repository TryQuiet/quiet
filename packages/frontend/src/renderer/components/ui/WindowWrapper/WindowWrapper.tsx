import React, { ReactElement } from 'react'
import classNames from 'classnames'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(() => ({
  root: {},
  wrapper: {
    'min-height': '100vh'
  }
}))

interface WindowWrapperProps {
  children: ReactElement
  className?: string
}

export const WindowWrapper: React.FC<WindowWrapperProps> = ({ children, className = '' }) => {
  const classes = useStyles({})
  return (
    <div
      className={classNames({
        [classes.wrapper]: true,
        [className]: className
      })}>
      {children}
    </div>
  )
}

export default WindowWrapper
