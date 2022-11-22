import React from 'react'

import Grid from '@mui/material/Grid'

export const Page: React.FC<{}> = ({ children }) => (
  <Grid container direction='column' style={{ height: '100vh' }}>
    {children}
  </Grid>
)

export default Page
