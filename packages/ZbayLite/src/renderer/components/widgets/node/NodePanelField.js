import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

export const NodePanelField = ({ classes, name, children }) => (
  <Grid container justify='space-between'>
    <Typography inline variant='overline'>
      {name}:
    </Typography>
    {children}
  </Grid>
)

NodePanelField.propTypes = {
  children: PropTypes.element.isRequired,
  name: PropTypes.string.isRequired
}

export default React.memo(NodePanelField)
