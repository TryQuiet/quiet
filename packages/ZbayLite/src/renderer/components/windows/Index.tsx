import React from 'react'

import { makeStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import Loading from './Loading'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  }
}))

interface IndexProps {
  bootstrapping: boolean
  bootstrappingMessage: string
}

export const Index: React.FC<IndexProps> = ({ bootstrapping = false, bootstrappingMessage = '' }) => {
  const classes = useStyles({})
  return (
    <WindowWrapper className={classes.root}>
      <Loading message={bootstrapping ? bootstrappingMessage : 'Waiting for Zcash node...'} />
    </WindowWrapper>
  )
}

export default Index
