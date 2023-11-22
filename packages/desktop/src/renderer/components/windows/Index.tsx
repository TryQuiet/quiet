import React from 'react'

import { styled } from '@mui/material/styles'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import Loading from './Loading'

const PREFIX = 'Index'

const classes = {
    root: `${PREFIX}root`,
}

const StyledWindowWrapper = styled(WindowWrapper)(() => ({
    [`&.${classes.root}`]: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag',
    },
}))

interface IndexProps {
    bootstrapping: boolean
    bootstrappingMessage: string
}

export const Index: React.FC<IndexProps> = ({ bootstrapping = false, bootstrappingMessage = '' }) => {
    return (
        <StyledWindowWrapper className={classes.root}>
            <Loading message={bootstrapping ? bootstrappingMessage : 'Waiting for Zcash node...'} />
        </StyledWindowWrapper>
    )
}

export default Index
