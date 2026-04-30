import React, { useEffect } from 'react'
import { styled } from '@mui/material/styles'
import { Route, Routes } from 'react-router-dom'

import Grid from '@mui/material/Grid'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import Sidebar from '../Sidebar/Sidebar'
import Channel from '../Channel/Channel'

const MainGridStyled = styled(Grid)(() => ({
  minHeight: '100vh',
  minWidth: '100vw',
  overflow: 'hidden',
  position: 'relative',
}))

export const Main: React.FC = () => {
  const debounce = (fn: () => void, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        timer = null
        fn.apply(this)
      }, ms)
    }
  }

  const [_dimensions, setDimensions] = React.useState({
    height: window.innerHeight,
    width: window.innerWidth,
  })

  useEffect(() => {
    const debouncedHandleResize = debounce(function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      })
    }, 1000)

    window.addEventListener('resize', debouncedHandleResize)

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
    }
  })

  return (
    <div>
      <WindowWrapper>
        <MainGridStyled container direction='row' wrap='nowrap'>
          <Grid item>
            <Sidebar />
          </Grid>
          <Grid item xs>
            <Routes>
              <Route path={'channel/:id'} element={<Channel />} />
            </Routes>
          </Grid>
        </MainGridStyled>
      </WindowWrapper>
    </div>
  )
}

export default Main
