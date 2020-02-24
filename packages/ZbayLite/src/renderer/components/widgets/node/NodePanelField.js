import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
const styles = theme => ({
  root: {},
  text: { opacity: 0.3 },
  textValue: { opacity: 0.7 }
})
export const NodePanelField = ({ classes, name, value }) => (
  <Grid item xs container direction='column' className={classes.root} spacing={0}>
    <Typography variant='overline' className={classes.text}>
      {name}:
    </Typography>
    <Typography variant='body2' className={classes.textValue}>
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
