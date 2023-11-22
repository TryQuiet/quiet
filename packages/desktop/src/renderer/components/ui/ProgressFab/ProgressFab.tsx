import React, { ReactElement } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import Fab from '@mui/material/Fab'
import CircularProgress from '@mui/material/CircularProgress'
import green from '@mui/material/colors/green'
import CheckIcon from '@mui/icons-material/Check'

const PREFIX = 'ProgressFab'

const classes = {
    root: `${PREFIX}root`,
    fabProgress: `${PREFIX}fabProgress`,
    wrapper: `${PREFIX}wrapper`,
    buttonSuccess: `${PREFIX}buttonSuccess`,
}

const Root = styled('div')(() => ({
    [`& .${classes.root}`]: {
        backgroundColor: '#8d8d8d',
        color: '#fff',
        '&:hover': {
            backgroundColor: '#737373',
        },
    },

    [`& .${classes.fabProgress}`]: {
        color: green[500],
        position: 'absolute',
        left: -6,
        top: -6,
        zIndex: 1,
    },

    [`&.${classes.wrapper}`]: {
        position: 'relative',
    },

    [`& .${classes.buttonSuccess}`]: {
        '&:disabled': {
            backgroundColor: green[500],
            color: '#fff',
        },
    },
}))

interface ProgressFabProps {
    className?: string
    children: ReactElement
    loading?: boolean
    success?: boolean
    disabled?: boolean
    onClick?: () => void
}

export const ProgressFab: React.FC<React.ComponentProps<typeof Fab> & ProgressFabProps> = ({
    className = '',
    children,
    loading = false,
    success = false,
    disabled = false,
    onClick,
    ...props
}) => {
    return (
        <Root
            className={classNames({
                [classes.wrapper]: true,
                [className]: className,
            })}
        >
            <Fab
                classes={{
                    root: classNames({
                        [classes.root]: true,
                        [classes.buttonSuccess]: success,
                    }),
                }}
                onClick={onClick}
                disabled={disabled}
                {...props}
            >
                {success ? <CheckIcon /> : children}
            </Fab>
            {loading && <CircularProgress size={68} className={classes.fabProgress} />}
        </Root>
    )
}

export default ProgressFab
