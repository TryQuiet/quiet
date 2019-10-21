import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Loading from '../../components/windows/Loading'

const styles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    WebkitAppRegion: 'drag'
  }
})

export const Index = ({ classes, bootstrapping, bootstrappingMessage }) => (
  <WindowWrapper className={classes.root}>
    <Loading message={bootstrapping ? bootstrappingMessage : 'Waiting for Zcash node...'} />
  </WindowWrapper>
)

Index.propTypes = {
  classes: PropTypes.object.isRequired,
  bootstrapping: PropTypes.bool.isRequired,
  bootstrappingMessage: PropTypes.string.isRequired
}

Index.defaultProps = {
  bootstrapping: false,
  bootstrappingMessage: ''
}

export default withStyles(styles)(Index)
