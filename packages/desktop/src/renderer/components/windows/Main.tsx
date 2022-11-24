import React, { useEffect } from 'react'
import { styled } from '@mui/material/styles';
import { Route } from 'react-router-dom'
import classnames from 'classnames'

import Grid from '@mui/material/Grid'


import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import Sidebar from '../Sidebar/Sidebar'
import Channel from '../Channel/Channel'

const PREFIX = 'Main';

const classes = {
  gridRoot: `${PREFIX}-gridRoot`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(() => ({
  [`& .${classes.gridRoot}`]: {
    'min-height': '100vh',
    'min-width': '100vw',
    overflow: 'hidden',
    position: 'relative'
  }
}));

interface MainProps {
  match: {
    url: string
  }
}

export const Main: React.FC<MainProps> = ({
  match
}) => {


  const debounce = (fn, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null
    return _ => {
      if (timer) {
        clearTimeout(timer)
      }
      // @ts-ignore
      timer = setTimeout(_ => {
        timer = null
        fn.apply(this) // eslint-disable-line
      }, ms)
    }
  }

  const [dimensions, setDimensions] = React.useState({
    height: window.innerHeight,
    width: window.innerWidth
  })

  useEffect(() => {
    const debouncedHandleResize = debounce(function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth
      })
    }, 1000)

    window.addEventListener('resize', debouncedHandleResize)

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
    }
  })

  return (
    (<Root>
      <WindowWrapper>
        <Grid container direction='row' className={classes.gridRoot} wrap='nowrap'>
          <Grid item>
            <Sidebar />
          </Grid>
          <Grid item xs>
            <Route path={`${match.url}/channel/:id`} component={Channel} />
            {/* <Route path={`${match.url}/direct-messages/:username`} component={DirectMessages} /> */}
          </Grid>
        </Grid>
      </WindowWrapper>
    </Root>)
  );
}

export default Main
