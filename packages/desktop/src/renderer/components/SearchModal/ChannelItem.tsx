import React, { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useEnterPress } from '../../containers/hooks'
import { PublicChannelStorage } from '@quiet/types'

interface ChannelItemProps {
    item: PublicChannelStorage
    focused: boolean
    className: string
    classNameSelected: string
    onClickHandler: (value: string) => void
    channelInput: string
}

const ChannelItem = ({
    item,
    focused,
    className,
    classNameSelected,
    onClickHandler,
    channelInput,
}: ChannelItemProps) => {
    const [_initialRender, setInitialRender] = useState(false)

    useEffect(() => {
        setInitialRender(true)
    }, [])

    useEnterPress(() => {
        if (focused) {
            onClickHandler(item.id)
        }
    }, [focused, channelInput])

    return (
        <div
            key={item.name}
            className={classNames(className, {
                [classNameSelected]: focused,
            })}
            tabIndex={0}
            onClick={() => {
                onClickHandler(item.id)
            }}
        >
            <Typography variant='body2'>{`# ${item.name}`}</Typography>
        </div>
    )
}

export default ChannelItem
