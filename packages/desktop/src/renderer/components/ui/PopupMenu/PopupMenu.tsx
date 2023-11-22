import React, { useRef } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import Popper from '@mui/material/Popper'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import { IPopupMenuProps } from './PopupMenu.d'

const PREFIX = 'PopupMenu'

const classes = {
    wrapper: `${PREFIX}wrapper`,
    paper: `${PREFIX}paper`,
    arrow: `${PREFIX}arrow`,
    bottom: `${PREFIX}bottom`,
    top: `${PREFIX}top`,
    popper: `${PREFIX}popper`,
}

const StyledPopper = styled(Popper)(({ theme }) => ({
    [`& .${classes.wrapper}`]: {},

    [`& .${classes.paper}`]: {
        background: theme.palette.background.default,
        boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
    },

    [`& .${classes.arrow}`]: {
        opacity: 1,
        position: 'absolute',
        width: 2 * constants.arrowSize,
        height: 2 * constants.arrowSize,
        '&::before': {
            content: '""',
            margin: 'auto',
            display: 'block',
            width: 0,
            height: 0,
            borderStyle: 'solid',
        },
    },

    [`& .${classes.bottom}`]: {
        top: 0,
        marginTop: `-${constants.arrowSize}px`,
        '&::before': {
            borderWidth: `0 ${constants.arrowSize}px ${constants.arrowSize}px ${constants.arrowSize}px`,
            borderColor: `transparent transparent ${theme.palette.background.default} transparent`,
        },
    },

    [`& .${classes.top}`]: {
        bottom: 0,
        marginBottom: `-${2 * constants.arrowSize}px`,
        '&::before': {
            borderWidth: `${constants.arrowSize}px ${constants.arrowSize}px 0 ${constants.arrowSize}px`,
            borderColor: `${theme.palette.background.default} transparent transparent transparent`,
        },
    },

    [`&.${classes.popper}`]: {
        zIndex: 100,
    },
}))

const constants = {
    arrowSize: 10,
}

export const PopupMenu: React.FC<IPopupMenuProps> = ({
    open = false,
    anchorEl,
    children,
    className = '',
    offset = 0,
    placement = 'bottom-end',
}) => {
    const arrowRef = useRef<HTMLSpanElement>(null)
    return (
        <StyledPopper
            open={open}
            anchorEl={anchorEl}
            transition
            placement={placement}
            disablePortal
            className={classes.popper}
            modifiers={[
                { name: 'arrow', enabled: Boolean(arrowRef.current), options: { element: arrowRef.current } },
                { name: 'offset', options: { offset } },
            ]}
        >
            {({ TransitionProps, placement }) => {
                const splitPlacement: keyof typeof classes = placement.split('-')[0] as
                    | 'wrapper'
                    | 'paper'
                    | 'bottom'
                    | 'top'
                    | 'arrow'
                    | 'popper'
                return (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <div className={classes.wrapper}>
                            <Paper
                                className={classNames({
                                    [classes.paper]: true,
                                    [className]: className,
                                })}
                            >
                                {children}
                            </Paper>
                            <span
                                className={classNames({
                                    [classes[splitPlacement]]: true,
                                })}
                                ref={arrowRef}
                            />
                        </div>
                    </Grow>
                )
            }}
        </StyledPopper>
    )
}

export default PopupMenu
