import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
const styles = theme => ({
  root: {
    borderTop: '1px solid',
    borderColor: 'rgb(82,28,116,0.50)'
  },
  text: {
    fontSize: '0.9rem'
  }
})
export const NodePanelField = ({ classes, name, value }) => (
  <Grid container justify='space-between' className={classes.root}>
    <Typography display='inline' variant='overline' className={classes.text}>
      {name}:
    </Typography>
    <Typography display='inline' variant='overline' className={classes.text}>
      {value}
    </Typography>
  </Grid>
)

NodePanelField.propTypes = {
  name: PropTypes.string.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(NodePanelField)
