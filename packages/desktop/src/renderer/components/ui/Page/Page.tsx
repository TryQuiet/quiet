import React from 'react'

import Grid from '@mui/material/Grid'

interface Props {
  children?: React.ReactNode
}

export const Page: React.FC<Props> = ({ children }) => (
  <Grid container direction='column' style={{ height: '100vh' }}>
    {children}
  </Grid>
)

export default Page
