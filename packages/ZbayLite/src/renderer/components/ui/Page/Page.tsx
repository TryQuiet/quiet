import React from 'react'

import Grid from '@material-ui/core/Grid'

interface PageProps {
  children: any[]
}

export const Page: React.FC<PageProps> = ({ children }) => (
  <Grid container direction='column' style={{ height: '100vh' }}>
    {children}
  </Grid>
)

export default Page
