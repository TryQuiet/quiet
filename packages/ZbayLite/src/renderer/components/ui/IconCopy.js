import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
  },
  main: {
    padding: 0,
    margin: 0
  },
  squareTop: {
    position: 'absolute',
    left: 4,
    top: 7
  },
  gradient: {
    maxWidth: 50,
    padding: 2,
    position: 'relative',
    backgroundImage: 'linear-gradient(315deg, #521576, #e42656)'
  },
  squareFill: {
    background: 'white',
    color: 'white',
    padding: 5
  },
  squareBottom: {
    position: 'absolute',
    left: 9,
    top: 2
  }
})

export const IconCopy = ({ classes }) => (
  <div className={classes.name}>
    <div className={classes.squareTop}>
      <div className={classes.gradient}>
        <div className={classes.squareFill} />
      </div>
    </div>
    <div className={classes.squareBottom}>
      <div className={classes.gradient}>
        <div className={classes.squareFill} />
      </div>
    </div>
  </div>
)

IconCopy.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IconCopy)
