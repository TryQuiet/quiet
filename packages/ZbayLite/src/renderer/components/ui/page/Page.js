import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'

export const Page = ({ children }) => (
  <Grid container direction='column' style={{ height: '100vh' }}>
    {children}
  </Grid>
)

Page.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
}

export default React.memo(Page)
