import React from 'react'

import { makeStyles, useTheme } from '@material-ui/core/styles'

import SpinnerLoader from '../../ui/Spinner/SpinnerLoader'

const useStyles = makeStyles(() => ({
  wrapper: {
    marginBottom: 90
  }
}))

export const LoadingMessage: React.FC = () => {
  const classes = useStyles({})
  const theme = useTheme()
  return (
    <SpinnerLoader
      message='Loading messages'
      size={50}
      color={theme.palette.colors.captionPurple}
      className={classes.wrapper}
    />
  )
}

export default LoadingMessage
