import React, { ReactElement } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

const PREFIX = 'WindowWrapper'

const classes = {
    root: `${PREFIX}root`,
    wrapper: `${PREFIX}wrapper`,
}

const Root = styled('div')(() => ({
    [`& .${classes.root}`]: {},

    [`&.${classes.wrapper}`]: {
        minHeight: '100vh',
    },
}))

interface WindowWrapperProps {
    children: ReactElement
    className?: string
}

export const WindowWrapper: React.FC<WindowWrapperProps> = ({ children, className = '' }) => {
    return (
        <Root
            className={classNames({
                [classes.wrapper]: true,
                [className]: className,
            })}
        >
            {children}
        </Root>
    )
}

export default WindowWrapper
