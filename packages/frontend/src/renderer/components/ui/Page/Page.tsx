import React from 'react'

import Grid from '@material-ui/core/Grid'

export const Page: React.FC<{}> = ({ children }) => (
  <Grid container direction='column' style={{ height: '100vh' }}>
    {children}
  </Grid>
)

export default Page
